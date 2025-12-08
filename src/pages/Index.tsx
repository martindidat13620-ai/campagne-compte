import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'comptable':
          navigate('/comptable');
          break;
        case 'candidat':
          navigate('/candidat');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-2xl">CC</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">ComptaCampagne</h1>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
};

export default Index;
