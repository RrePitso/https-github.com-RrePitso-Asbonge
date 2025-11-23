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
  day: string;
  orders: number;
  revenue: number;
}

export interface CategoryStat {
  name: string;
  value: number;
}

export type AdminRole = 'super_admin' | 'driver';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  instructions: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'assigned' | 'delivered';
  assignedDriverId?: string; // Email of the driver
  createdAt: string;
  paymentMethod: 'cash' | 'card';
}