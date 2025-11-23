export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  cuisine: string;
  deliveryTime: string;
  image: string;
  menu: MenuItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export enum DeliveryType {
  FOOD = 'FOOD',
  PARCEL = 'PARCEL'
}

export interface ParcelRequest {
  pickupAddress: string;
  deliveryAddress: string;
  description: string;
  weight: string;
  senderName: string;
  recipientName: string;
}

// Stats for Admin Dashboard
export interface DailyStat {
  name: string; // Changed from day to name to match Recharts expected format
  orders: number;
  revenue: number;
  [key: string]: any;
}

export interface CategoryStat {
  name: string;
  value: number;
  [key: string]: any;
}

export interface DriverStat {
  email: string;
  totalJobs: number;
  totalRevenue: number;
  averageRating: number;
  ratingCount: number;
}

export type AdminRole = 'super_admin' | 'driver';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

export interface Order {
  id: string;
  userId?: string; // Link to the customer
  customerName: string;
  customerPhone: string;
  address: string; // Delivery Address
  instructions: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'assigned' | 'delivered';
  assignedDriverId?: string; // Email of the driver
  createdAt: string;
  paymentMethod: 'cash' | 'card';
  // New fields for Parcel logic
  type?: 'food' | 'parcel';
  pickupAddress?: string;
  recipientName?: string;
  // Review System
  rating?: number;
  feedback?: string;
}

export interface FeeSettings {
  foodDeliveryFee: number;
  parcelSmallFee: number;  // 0-5kg
  parcelMediumFee: number; // 5-20kg
  parcelLargeFee: number;  // 20kg+
}

export interface SavedAddress {
  label: string; // e.g. "Home", "Work", or the address itself
  address: string;
}