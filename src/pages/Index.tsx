import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (hasRole('comptable')) {
      navigate('/comptable');
    } else if (hasRole('candidat')) {
      navigate('/candidat');
    } else if (hasRole('mandataire')) {
      navigate('/mandataire');
    } else {
      navigate('/en-attente');
    }
  }, [user, hasRole, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src="/logo_mcc.png" 
          alt="Campagn'expert" 
          className="w-32 h-auto mx-auto mb-4"
        />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
};

export default Index;
