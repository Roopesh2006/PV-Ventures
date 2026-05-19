import { Timestamp } from "firebase/firestore";

export interface Seller {
  id: string;
  name: string;
  companyName: string;
  gstin: string;
  address: string;
  accountDetails: string;
  businessPan: string;
  yearOfEstablishment: number;
  userId: string;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  weight: string;
  sku: string;
  costPrice: number;
  profit: number;
  packagingCost: number;
  images: string[];
  category?: string;
  unit: string; // e.g., "Bag", "Piece", "Kg"
  sellerId: string;
  userId: string;
  createdAt: Timestamp;
}

export enum UserRole {
  BUYER = "buyer",
  SELLER = "seller",
}
