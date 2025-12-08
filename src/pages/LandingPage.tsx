import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Calculator, 
  Eye, 
  ArrowRight, 
  Shield, 
  FileText, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAccessSpace = (role: 'mandataire' | 'comptable' | 'candidat') => {
    login(`${role}@example.com`, 'password');
    
    switch (role) {
      case 'comptable':
        navigate('/comptable');
        break;
      case 'candidat':
        navigate('/candidat');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Saisie simplifiée",
      description: "Enregistrez vos dépenses et recettes en quelques clics avec justificatifs"
    },
    {
      icon: BarChart3,
      title: "Suivi en temps réel",
      description: "Visualisez l'avancement de votre campagne par rapport au plafond légal"
    },
    {
      icon: Shield,
      title: "Conformité CNCCFP",
      description: "Export des données au format conforme aux exigences réglementaires"
    },
    {
      icon: CheckCircle2,
      title: "Validation comptable",
      description: "Processus de validation intégré avec votre expert-comptable"
    }
  ];

  const spaces = [
    {
      role: 'mandataire' as const,
      icon: Users,
      title: "Espace Mandataire",
      description: "Gérez les dépenses et recettes de votre campagne, suivez le plafond légal et consultez vos tableaux de bord.",
      color: "bg-primary hover:bg-primary/90",
      textColor: "text-primary-foreground"
    },
    {
      role: 'comptable' as const,
      icon: Calculator,
      title: "Espace Comptable",
      description: "Validez les opérations, vérifiez les justificatifs et exportez les données pour toutes les campagnes.",
      color: "bg-accent hover:bg-accent/90",
      textColor: "text-accent-foreground"
    },
    {
      role: 'candidat' as const,
      icon: Eye,
      title: "Espace Candidat",
      description: "Consultez en lecture seule les tableaux de bord et l'avancement de votre campagne.",
      color: "bg-secondary hover:bg-secondary/90",
      textColor: "text-secondary-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">CC</span>
            </div>
            <span className="font-bold text-xl text-foreground">ComptaCampagne</span>
          </div>
          <Button variant="outline" size="sm">
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Gérez vos comptes de campagne en toute <span className="text-primary">simplicité</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            La solution professionnelle pour les mandataires financiers, experts-comptables et candidats. 
            Conformité CNCCFP garantie.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Access Spaces */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Accédez à votre espace</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choisissez votre profil pour accéder aux fonctionnalités adaptées à votre rôle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {spaces.map((space) => (
            <Card 
              key={space.role} 
              className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group"
              onClick={() => handleAccessSpace(space.role)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-2xl ${space.color} flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110`}>
                  <space.icon className={`w-8 h-8 ${space.textColor}`} />
                </div>
                <CardTitle className="text-xl">{space.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-6">{space.description}</CardDescription>
                <Button 
                  className={`w-full ${space.color} ${space.textColor}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccessSpace(space.role);
                  }}
                >
                  Accéder
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CC</span>
              </div>
              <span className="font-semibold text-foreground">ComptaCampagne</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ComptaCampagne. Solution conforme CNCCFP.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
