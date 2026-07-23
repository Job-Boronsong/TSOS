import { createContext, useContext, ReactNode } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import type { Session } from "@workspace/api-client-react";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading, isFetching } = useGetMe();
  const logoutMutation = useLogout();

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  // Guard: treat "fetching with no data yet" as loading.
  // React Query's `isLoading` = status==='pending' && isFetching.
  // But after login we call refetchQueries on a previously-error query:
  // status stays 'error' during the refetch, so isLoading stays false
  // even though we haven't confirmed the session yet.
  // Using (isFetching && !session) covers this case without causing
  // a loading flash on normal background refetches (where session exists).
  const effectiveLoading = isLoading || (isFetching && !session);

  return (
    <AuthContext.Provider value={{ session: session || null, isLoading: effectiveLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
