export type ResourceType = 'energy' | 'bandwidth';

export type PaymentMethod = 'wallet' | 'account';

export type Language = 'zh-CN' | 'zh-TW' | 'en';

export interface WalletInfo {
  connected: boolean;
  address: string | null;
  walletBalance: number; // in TRX
  accountBalance: number; // in TRX
  availableEnergy: number;
  totalEnergy: number;
  availableBandwidth: number;
  totalBandwidth: number;
}

export interface RentalOrder {
  id: string;
  txHash?: string;
  resourceType: ResourceType;
  amountPerAddress: number;
  durationMinutes: number;
  addresses: string[];
  totalCost: number; // in TRX
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: string;
  expiresAt: string;
}

export interface TransferEstimateOption {
  id: string;
  name: string;
  energyNeeded: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
}
