import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Calculator, 
  Eye, 
  FileText, 
  BarChart3,
  CheckCircle2,
  LogIn,
  Loader2,
  Phone,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
import logo from '@/assets/logo_mcc.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading, hasRole } = useAuth();

  const handleAccessSpace = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (hasRole('comptable')) {
      navigate('/comptable');
    } else if (hasRole('mandataire')) {
      navigate('/mandataire');
    } else if (hasRole('candidat')) {
      navigate('/candidat');
    } else {
      navigate('/en-attente');
    }
  };

  const handleContact = () => {
    window.location.href = 'tel:0624610716';
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
      icon: Clock,
      title: "Gain de temps",
      description: "Automatisez vos calculs et générez vos rapports instantanément"
    },
    {
      icon: CheckCircle2,
      title: "Validation comptable",
      description: "Processus de validation intégré avec votre expert-comptable"
    }
  ];

  const benefits = [
    "Suivi du plafond légal en temps réel",
    "Tableau de bord complet et intuitif",
    "Gestion centralisée des justificatifs",
    "Collaboration simplifiée avec votre comptable"
  ];

  const spaces = [
    {
      role: 'mandataire' as const,
      icon: Users,
      title: "Espace Mandataire",
      description: "Gérez les dépenses et recettes de votre campagne, suivez le plafond légal et consultez vos tableaux de bord.",
      gradient: "from-primary to-primary/80"
    },
    {
      role: 'comptable' as const,
      icon: Calculator,
      title: "Espace Comptable",
      description: "Validez les opérations, vérifiez les justificatifs et exportez les données pour toutes les campagnes.",
      gradient: "from-accent to-accent/80"
    },
    {
      role: 'candidat' as const,
      icon: Eye,
      title: "Espace Candidat",
      description: "Consultez en lecture seule les tableaux de bord et l'avancement de votre campagne.",
      gradient: "from-secondary to-secondary/80"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Mes Comptes de Campagne" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleContact} className="hidden sm:flex">
              <Phone className="h-4 w-4 mr-2" />
              06 24 61 07 16
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              {user ? 'Mon espace' : 'Se connecter'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              La solution de gestion de comptes de campagne
            </div>
            
            <img src={logo} alt="Mes Comptes de Campagne" className="h-32 md:h-44 w-auto mx-auto mb-8" />
            
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Simplifiez la gestion de vos 
              <span className="text-primary"> comptes de campagne</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              La solution professionnelle pour les mandataires financiers, experts-comptables et candidats. 
              Gagnez du temps et gardez le contrôle sur vos finances de campagne.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={handleAccessSpace} className="text-lg px-8 py-6">
                {user ? 'Accéder à mon espace' : 'Commencer maintenant'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleContact} className="text-lg px-8 py-6">
                <Phone className="h-5 w-5 mr-2" />
                Nous contacter
              </Button>
            </div>

            {/* Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour gérer efficacement vos comptes de campagne
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access Spaces */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Accédez à votre espace</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connectez-vous pour accéder aux fonctionnalités adaptées à votre rôle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {spaces.map((space) => (
              <Card 
                key={space.role} 
                className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group"
              >
                <div className={`h-2 bg-gradient-to-r ${space.gradient}`} />
                <CardHeader className="text-center pt-8 pb-4">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${space.gradient} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <space.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{space.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <CardDescription className="text-base">{space.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Prêt à simplifier votre gestion de campagne ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Contactez-nous dès aujourd'hui pour découvrir comment nous pouvons vous accompagner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleContact} className="text-lg px-8 py-6">
                <Phone className="h-5 w-5 mr-2" />
                06 24 61 07 16
              </Button>
              <Button size="lg" variant="outline" onClick={handleAccessSpace} className="text-lg px-8 py-6">
                {user ? 'Accéder à mon espace' : 'Se connecter'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Mes Comptes de Campagne" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleContact}>
                <Phone className="h-4 w-4 mr-2" />
                06 24 61 07 16
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Mes Comptes de Campagne. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
