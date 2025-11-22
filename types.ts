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
