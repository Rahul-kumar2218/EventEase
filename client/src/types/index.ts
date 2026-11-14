export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Organizer' | 'Check-in Staff' | 'Participant';
  assignedEvents?: Array<Event | string>;
  createdAt?: string;
}

export interface TicketTier {
  tierId: string;
  name: string;
  price: number;
  capacity: number;
  soldCount?: number;
  description?: string;
}

export interface Event {
  _id: string;
  eventId: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  locationUrl?: string;
  imageUrl?: string;
  capacity: number;
  registrationCount: number;
  attendanceCount: number;
  ticketTiers?: TicketTier[];
  organizerId: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  assignedStaff?: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  cancellationReason?: string;
  registrationDeadline?: string | null;
  waitlist?: Array<{
    name: string;
    email: string;
    phone: string;
    college: string;
    department: string;
    year: string;
    addedAt: string;
    promoted?: boolean;
    promotedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  _id: string;
  participantId: string;
  eventId: Event | string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  entryCode: string;
  qrToken: string;
  checkedIn: boolean;
  checkInTime: string | null;
  status: 'registered' | 'attended' | 'cancelled' | 'revoked';
  cancellationReason?: string;
  ticketTier?: string;
  registeredAt: string;
}

export interface CheckInResult {
  success: boolean;
  status: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID_ENTRY' | 'READY_FOR_CHECK_IN' | 'TICKET_REVOKED' | 'TICKET_CANCELLED' | string;
  message: string;
  participant?: {
    id?: string;
    participantId?: string;
    name?: string;
    email?: string;
    college?: string;
    department?: string;
    year?: string;
    entryCode?: string;
    ticketTier?: string;
  };
  checkInTime?: string;
  event?: {
    id?: string;
    name?: string;
    date?: string;
  };
}

export interface EventStats {
  capacity: number;
  registered: number;
  checkedIn: number;
  remainingSeats: number;
  notArrived: number;
  attendanceRate: number;
}

export interface CrowdTelemetry {
  capacity: number;
  registered: number;
  currentAttendance: number;
  availableSeats: number;
  occupancyRate: number;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  recentCheckIns15m: number;
  velocityPerMinute: number;
  gatesDistribution: Array<{ gate: string; count: number }>;
}

export interface CheckInLog {
  _id: string;
  checkInId: string;
  eventId: string;
  participantId: {
    name: string;
    email: string;
    participantId: string;
    entryCode: string;
    college?: string;
    department?: string;
  };
  checkedInBy: {
    name: string;
    email: string;
    role: string;
  };
  checkedInAt: string;
  method: 'QR' | 'MANUAL' | 'OFFLINE_SYNC';
  status: 'SUCCESS' | 'DUPLICATE' | 'INVALID';
  gate?: string;
  notes?: string;
}
