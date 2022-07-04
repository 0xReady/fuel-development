import { QueryClientProvider } from 'react-query';
import { QueryClient } from 'react-query';
import { ReactNode } from 'React';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // onError: handleError,
      // These two are annoying during development
      retry: false,
      refetchOnWindowFocus: false,
      // This is disabled because it causes a bug with arrays with named keys
      // For example, if a query returns: [BN, BN, a: BN, b: BN]
      // with this option on it will be cached as: [BN, BN]
      // and break our code
      structuralSharing: false,
    },
    mutations: {
      // onError: handleError,
    },
  },
});

interface ProvidersProps {
  children?: ReactNode;
}
export default function Providers({ children }: ProvidersProps) {
  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  );
}
