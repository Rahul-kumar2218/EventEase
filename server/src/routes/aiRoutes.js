import express from 'express';
import { Event } from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.js';
import { findEventByIdOrEventId } from './eventRoutes.js';

const router = express.Router();

/**
 * Helper to call Gemini API if key is available
 */
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return null;
  }
};

// @route   POST /api/ai/generate-description
// @desc    AI Assistant generates structured event description & agenda
// @access  Private (Organizer, Admin)
router.post('/generate-description', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const { title, category, venue, targetAudience, keyTopics } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        requiresApiKey: true,
        message: 'GEMINI_API_KEY is not configured in server/.env. Add your Google Gemini API key to activate real-time generative AI copy.',
      });
    }

    const prompt = `You are an expert event organizer copywriter. Write a compelling, professional, engaging description for an event with the following details:
Title: "${title}"
Category: "${category || 'General'}"
Venue: "${venue || 'Campus Auditorium'}"
Target Audience: "${targetAudience || 'College students and tech professionals'}"
Key Topics / Highlights: "${keyTopics || 'Keynotes, Networking, Interactive workshops'}"

Include:
1. Overview & Hook (2 paragraphs)
2. What You Will Learn / Experience (4 bullet points)
3. Who Should Attend
Keep the tone inspiring, energetic, and professional. Return raw clean text without markdown triple quotes.`;

    const generatedText = await callGemini(prompt);

    if (!generatedText) {
      return res.status(502).json({
        success: false,
        message: 'Unable to reach Gemini API. Please check your network and API key.',
      });
    }

    res.status(200).json({
      success: true,
      description: generatedText.trim(),
    });
  } catch (error) {
    console.error('AI Description error:', error);
    res.status(500).json({ success: false, message: 'Server error generating event description.' });
  }
});

// @route   POST /api/ai/generate-faqs
// @desc    AI Assistant generates event FAQs
// @access  Private (Organizer, Admin)
router.post('/generate-faqs', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const { title, description, venue, date, time } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        requiresApiKey: true,
        message: 'GEMINI_API_KEY is not configured in server/.env. Add your Google Gemini API key to activate AI FAQ generation.',
      });
    }

    const prompt = `Generate 5 realistic, helpful FAQs for an attendee registering for the following event:
Event Name: "${title}"
Description: "${description || ''}"
Venue: "${venue || ''}"
Date & Time: "${date || ''} ${time || ''}"

Return the output strictly as a JSON array of objects with keys "question" and "answer". Do not include markdown codeblocks or explanation.`;

    const rawResponse = await callGemini(prompt);
    if (!rawResponse) {
      return res.status(502).json({ success: false, message: 'Gemini API failed to respond.' });
    }

    let faqs = [];
    try {
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      faqs = JSON.parse(cleanJson);
    } catch (e) {
      faqs = [{ question: 'What should I bring to the gate?', answer: 'Your digital pass with QR code and a valid college ID.' }];
    }

    res.status(200).json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error('AI FAQs error:', error);
    res.status(500).json({ success: false, message: 'Server error generating FAQs.' });
  }
});

// @route   POST /api/ai/ask-event
// @desc    Participant AI Q&A bot grounded in real event data
// @access  Public
router.post('/ask-event', async (req, res) => {
  try {
    const { eventId, question } = req.body;

    if (!eventId || !question) {
      return res.status(400).json({ success: false, message: 'EventId and question are required.' });
    }

    const event = await findEventByIdOrEventId(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        requiresApiKey: true,
        message: 'AI Assistant requires GEMINI_API_KEY in server/.env.',
        groundedFacts: {
          name: event.name,
          date: event.date,
          timing: `${event.startTime} - ${event.endTime}`,
          venue: event.venue,
          capacity: event.capacity,
          remainingSeats: Math.max(0, event.capacity - event.registrationCount),
        },
      });
    }

    const prompt = `You are a helpful event support assistant for the following event:
Title: "${event.name}"
Description: "${event.description}"
Date: ${event.date}
Timing: ${event.startTime} to ${event.endTime}
Venue: ${event.venue}
Capacity: ${event.capacity} seats (${Math.max(0, event.capacity - event.registrationCount)} remaining)
Category: ${event.category}

User Question: "${question}"

Provide a concise, helpful, friendly answer in 2-3 sentences based ONLY on the provided event information. If the answer cannot be determined from the event data, politely advise them to check with the event organizer.`;

    const answer = await callGemini(prompt);
    res.status(200).json({
      success: true,
      answer: answer ? answer.trim() : 'Please check with the organizer at the venue information desk.',
    });
  } catch (error) {
    console.error('Ask event error:', error);
    res.status(500).json({ success: false, message: 'Server error answering question.' });
  }
});

// @route   GET /api/ai/recommendations
// @desc    Smart recommendations for similar / upcoming events
// @access  Public
router.get('/recommendations', async (req, res) => {
  try {
    const { category, currentEventId } = req.query;

    const query = { status: { $ne: 'cancelled' } };
    if (currentEventId) {
      query._id = { $ne: currentEventId };
    }

    let recommendations = [];
    if (category) {
      recommendations = await Event.find({
        ...query,
        category: { $regex: new RegExp(category, 'i') },
      })
        .limit(4)
        .select('name eventId date startTime endTime venue capacity registrationCount category imageUrl');
    }

    // Fallback or fill up to 4 with upcoming popular events
    if (recommendations.length < 4) {
      const moreEvents = await Event.find({
        ...query,
        _id: { $nin: recommendations.map((r) => r._id) },
      })
        .sort({ registrationCount: -1, createdAt: -1 })
        .limit(4 - recommendations.length)
        .select('name eventId date startTime endTime venue capacity registrationCount category imageUrl');
      recommendations = [...recommendations, ...moreEvents];
    }

    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving recommendations.' });
  }
});

export default router;

