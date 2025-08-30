export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  profileImage?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  password: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  category: BusinessCategory;
  images: string[];
  averageWaitTime: number;
  currentQueueCount: number;
  maxQueueCapacity: number;
  isActive: boolean;
  isVerified: boolean;
  operatingHours: OperatingHours;
  createdAt: Date;
  updatedAt: Date;
}

export interface Queue {
  id: string;
  businessId: string;
  userId: string;
  position: number;
  estimatedWaitTime: number;
  status: QueueStatus;
  joinedAt: Date;
  notifiedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: string;
  paymentMethodId: string;
  stripeSubscriptionId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "user" | "business" | "support";
  content: string;
  messageType: MessageType;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  businessId: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  referralCode: string;
  status: ReferralStatus;
  rewardAmount: number;
  rewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum BusinessCategory {
  RESTAURANT = "restaurant",
  HOTEL = "hotel",
  CAFE = "cafe",
  RETAIL = "retail",
  HEALTHCARE = "healthcare",
  GOVERNMENT = "government",
  OTHER = "other"
}

export enum QueueStatus {
  WAITING = "waiting",
  NOTIFIED = "notified",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show"
}

export enum SubscriptionPlan {
  FREE = "free",
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CANCELLED = "cancelled",
  PAST_DUE = "past_due"
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay"
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded"
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  STICKER = "sticker",
  VOICE = "voice"
}

export enum NotificationType {
  QUEUE_UPDATE = "queue_update",
  QUEUE_READY = "queue_ready",
  SUBSCRIPTION_REMINDER = "subscription_reminder",
  PROMOTIONAL = "promotional",
  SYSTEM = "system"
}

export enum ReferralStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  EXPIRED = "expired"
}

// Supporting Interfaces
export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  isClosed: boolean;
}

export interface ConversationParticipant {
  id: string;
  type: "user" | "business";
  joinedAt: Date;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database Connection Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Socket Events
export interface SocketEvents {
  connection: (socket: any) => void;
  disconnect: () => void;
  joinQueue: (data: { businessId: string }) => void;
  leaveQueue: (data: { queueId: string }) => void;
  sendMessage: (data: { conversationId: string; content: string; messageType: MessageType }) => void;
  joinChat: (data: { conversationId: string }) => void;
  leaveChat: (data: { conversationId: string }) => void;
}
