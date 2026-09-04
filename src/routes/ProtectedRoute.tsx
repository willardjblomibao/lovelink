import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { FullScreenLoader } from '@/components/ui/Spinner';

/**
 * Gates a route behind: signed in -> role chosen -> partner linked.
 * Pass `stage` to bypass later checks for onboarding routes themselves.
 */
export function ProtectedRoute({
  children,
  stage = 'full'
}: {
  children: ReactNode;
  stage?: 'auth-only' | 'role-only' | 'full';
}) {
  const { session, profile, loading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/welcome" replace />;

  if (stage === 'auth-only') return <>{children}</>;

  if (!profile?.role) return <Navigate to="/choose-role" replace />;
  if (stage === 'role-only') return <>{children}</>;

  if (coupleLoading) return <FullScreenLoader />;
  const isLinked = couple?.boyfriend_id && couple?.girlfriend_id;
  if (!isLinked) return <Navigate to="/link-partner" replace />;

  return <>{children}</>;
}
