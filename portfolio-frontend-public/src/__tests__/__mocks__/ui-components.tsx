import { ReactNode } from 'react';
import { vi } from 'vitest';

// Mock UI components
export const Toaster = () => null;
export const TooltipProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

// Mock QueryClient
export const QueryClient = vi.fn();
export const QueryClientProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

// Mock Router components
export const BrowserRouter = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Route = ({ element }: { element: ReactNode }) => element; 