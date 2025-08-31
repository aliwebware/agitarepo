import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  MapPin,
  Calendar,
  Ticket,
  Users,
  Star,
  Menu,
  X,
  Shield,
  Heart,
  Zap,
  Mail,
  Phone,
  Camera,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Ajuste o caminho conforme sua estrutura
import InstaIcon from "@/../public/icons/insta.svg";
import FacebookIcon from "@/../public/icons/facebook.svg";
import WhatsappIcon from "@/../public/icons/whatsapp.svg";
import Head from "next/head";

const ApuAppWebsite = () => {
  const [activeTab, setActiveTab] = useState("sobre");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginState, setLoginState] = useState("idle"); // idle, loading, success, error
  const [registerState, setRegisterState] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const tabContentRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Verificar se há usuário logado ao carregar a página
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsLoggedIn(true);
          setUser({
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "Usuário",
            email: session.user.email ?? "",
          });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listener para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser({
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Usuário",
          email: session.user.email ?? "",
        });
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll animations para funcionalidades tab
  useEffect(() => {
    if (activeTab !== "funcionalidades") return;

    let ticking = false;

    function updateScrollAnimations() {
      const elements = document.querySelectorAll("[data-scroll-animation]");
      const scrollDot = document.getElementById("scrollDot");
      const scrollProgress =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);

      if (scrollDot) {
        const timelineContainer = scrollDot.closest(".relative");
        if (timelineContainer) {
          const containerHeight = (timelineContainer as HTMLElement).offsetHeight;
          const dotPosition = Math.min(
            Math.max(scrollProgress * containerHeight * 3, 20),
            containerHeight - 40
          );
          scrollDot.style.transform = `translateX(-50%) translateY(${dotPosition}px)`;
        }
      }

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;

        const isVisible =
          elementTop < windowHeight - 100 && elementTop + elementHeight > 100;

        const el = element as HTMLElement;
        if (isVisible && el.style.opacity !== "1") {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) translateX(0)";
        }
      });

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateScrollAnimations);
        ticking = true;
      }
    }

    setTimeout(updateScrollAnimations, 100);

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
    };
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginState("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: typeof email === "string" ? email : "",
        password: typeof password === "string" ? password : "",
      });

      if (error) {
        setLoginState("error");
        setErrorMessage(error.message);
        setTimeout(() => setLoginState("idle"), 3000);
        return;
      }

      setLoginState("success");
      setSuccessMessage("Login realizado com sucesso!");
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginState("idle");
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erro no login:", error);
      setLoginState("error");
      setErrorMessage("Erro inesperado no login");
      setTimeout(() => setLoginState("idle"), 3000);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterState("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const name = typeof formData.get("name") === "string" ? formData.get("name") as string : "";
    const email = typeof formData.get("email") === "string" ? formData.get("email") as string : "";
    const password = typeof formData.get("password") === "string" ? formData.get("password") as string : "";

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        setRegisterState("error");
        setErrorMessage(error.message);
        setTimeout(() => setRegisterState("idle"), 3000);
        return;
      }

      setRegisterState("success");
      setSuccessMessage(
        "Cadastro realizado! Verifique seu email para confirmar a conta."
      );
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterState("idle");
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setRegisterState("error");
      setErrorMessage("Erro inesperado no cadastro");
      setTimeout(() => setRegisterState("idle"), 3000);
    }
  };
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro no logout:", error);
        alert("Erro ao fazer logout");
      }
      // O estado será atualizado automaticamente pelo listener
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const handleClick = () => {
    router.push("/registrarApupu");
  };
  const handleClick2 = () => {
    router.push("/minhasFestas");
  };

  type TabButtonProps = {
    children: React.ReactNode;
    isActive: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  };

  const TabButton: React.FC<TabButtonProps> = ({ children, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${isActive
        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
        : "bg-black/30 text-white hover:bg-black/40 backdrop-blur-sm border border-gray-600"
        }`}
    >
      {children}
    </button>
  );

  type FeatureCardProps = {
    icon: React.ElementType;
    title: string;
    description: string;
    delay: number;
  };

  const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, delay }) => (
    <div
      className="bg-black/40 backdrop-blur-md rounded-2xl p-6 transform hover:scale-105 transition-all duration-500 hover:bg-black/50 border border-gray-600 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-gradient-to-r from-pink-500 via-fuchsia-600 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );

  const AppScreenshot: React.FC<{ title?: string }> = ({ title }) => (
    <div className={"relative group"}>
      <Image src="/phone1.png" alt={title ?? "phone"} width={400} height={400} />
    </div>
  );

  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }

  const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  // Scroll automático ao trocar de aba
  useEffect(() => {
    if (tabContentRef.current) {
      tabContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Viva com intensidade!</div>
      </div>
    );
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-pink-500 to-purple-600"></div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 ml-2"></div>
    </div>
  );

  const SuccessIcon = () => (
    <div className="flex items-center justify-center">
      <div className="rounded-full bg-gradient-to-r from-green-400 to-green-600 p-3 animate-bounce">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
    </div>
  );

  const ErrorIcon = () => (
    <div className="flex items-center justify-center">
      <div className="rounded-full bg-gradient-to-r from-red-400 to-red-600 p-3 animate-pulse">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Agita - Descubra e Cadastre Festas</title>
        <meta name="description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta property="og:title" content="Agita - Descubra e Cadastre Festas" />
        <meta property="og:description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta property="og:image" content="https://www.seusite.com/og-image.jpg" />
        <meta property="og:url" content="https://www.seusite.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Agita - Descubra e Cadastre Festas" />
        <meta name="twitter:description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta name="twitter:image" content="https://www.seusite.com/og-image.jpg" />
        <link rel="canonical" href="https://www.seusite.com" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 bg-opacity-90 rounded-full blur-3xl animate-pulse opacity-20"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-black/90 backdrop-blur-lg" : "bg-transparent"
            }`}
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                onClick={() => setActiveTab("sobre")}
                alt="Logo ApuApp"
                width={250}
                height={250}
                priority
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex gap-2">
                <TabButton
                  isActive={activeTab === "sobre"}
                  onClick={() => setActiveTab("sobre")}
                >
                  Sobre
                </TabButton>
                <TabButton
                  isActive={activeTab === "funcionalidades"}
                  onClick={() => setActiveTab("funcionalidades")}
                >
                  Funcionalidades
                </TabButton>
                <TabButton
                  isActive={activeTab === "baixar"}
                  onClick={() => setActiveTab("baixar")}
                >
                  Baixar
                </TabButton>
                <TabButton
                  isActive={activeTab === "ajuda"}
                  onClick={() => setActiveTab("ajuda")}
                >
                  Ajuda
                </TabButton>
              </div>

              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Olá, {user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 text-white hover:text-purple-300 transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 bg-opacity-90 rounded-lg hover:shadow-lg transition-all"
                  >
                    Cadastrar
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-black/90 backdrop-blur-lg border-t border-gray-800">
              <div className="container mx-auto px-4 py-4 space-y-3">
                <TabButton
                  isActive={activeTab === "sobre"}
                  onClick={() => {
                    setActiveTab("sobre");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sobre
                </TabButton>
                <TabButton
                  isActive={activeTab === "funcionalidades"}
                  onClick={() => {
                    setActiveTab("funcionalidades");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Funcionalidades
                </TabButton>
                <TabButton
                  isActive={activeTab === "baixar"}
                  onClick={() => {
                    setActiveTab("baixar");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Baixar
                </TabButton>
                <TabButton
                  isActive={activeTab === "ajuda"}
                  onClick={() => {
                    setActiveTab("ajuda");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Ajuda
                </TabButton>

                {isLoggedIn ? (
                  <div className="pt-3 space-y-2">
                    <div className="text-gray-300 text-center">
                      Olá, {user?.name}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-white hover:text-purple-300 transition-colors text-center"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        setShowRegisterModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg transition-all"
                    >
                      Cadastrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <div className="relative z-10 pt-20">
          {/* Hero Section */}
            <div className="relative container mx-auto px-4 py-32 min-h-[70vh] flex items-center justify-center text-center overflow-hidden">
            {/* Background Image com fade effect */}
            <div className="absolute inset-0 z-0">
              <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-50 animate-fade-in mt-4"
              style={{
                maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)",
              }}
              >
              <source src="/bgv.mp4" type="video/mp4" />
              Seu navegador não suporta vídeo em background.
              </video>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10 max-w-4xl mx-auto">
              <h1
              style={{ fontFamily: "Lequire, sans-serif" }}
              className="text-5xl md:text-7xl mb-6 text-white animate-fade-in"
              >
              Agitamos a sua vida
              </h1>
              <p
              className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
              >
              Descubra, organize e participe das melhores festas da cidade com a plataforma 
              Agita
              </p>
              <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
              >
              <button
                onClick={() => setActiveTab("baixar")}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Agora
              </button>
              <button
                onClick={handleClick}
                className="px-8 py-4 bg-black/40 backdrop-blur-sm rounded-full font-semibold text-lg hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white transition-all duration-300 border border-gray-600 flex items-center gap-2"
              >
                Cadastrar uma Festa
              </button>
              {isLoggedIn ? (
                <button
                onClick={handleClick2}
                className="px-8 py-4 bg-white/90 text-black  backdrop-blur-sm rounded-full font-semibold text-lg hover:bg-black/50 hover:text-white transition-all duration-300 border border-gray-600 flex items-center gap-2"
                >
                Minhas Festas
                </button>
              ) : (
                <></>
              )}
              </div>
            </div>
            </div>

          {/* Tab Content */}
          <div ref={tabContentRef} className="container mx-auto px-4 py-16">
            {activeTab === "sobre" && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                    Sobre o Agita
                  </h2>
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    O Agita é a plataforma definitiva para descobrir e participar
                    das melhores festas da sua cidade. Conecte-se com a
                    vida noturna, encontre festas incríveis e viva experiências
                    inesquecíveis.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Eventos do Mês
                        </h3>
                        <p className="text-gray-300">
                          Descubra todas as festas programadas para o
                          mês inteiro, organizadas por data e localização.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Localização Inteligente
                        </h3>
                        <p className="text-gray-300">
                          Encontre as festas com geolocalização avançada.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Comunidade Ativa
                        </h3>
                        <p className="text-gray-300">
                          (Proposta) Conecte-se com outros usuários, compartilhe experiências
                          e descubra novos amigos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <AppScreenshot title="Tela principal do ApuApp" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-8">
                    Nossa Missão
                  </h3>
                  <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                    Democratizar o acesso à vida noturna,
                    por meio de uma plataforma que conecta pessoas, organizadores e
                    locais de forma simples, segura e divertida. Queremos que cada
                    noite seja uma nova aventura!
                  </p>
                </div>
              </div>
            )}

            {/* FUNCIONALIDADES */}
            {activeTab === "funcionalidades" && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                    Funcionalidades
                  </h2>
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Descubra todas as funcionalidades poderosas que fazem do Agita a
                    melhor escolha para sua vida social
                  </p>
                </div>

                {/* Phone Features Timeline */}
                <div className="mb-16 relative">
                  {/* Continuous Timeline Line */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-pink-500 opacity-30"
                    style={{ height: "100%", top: 0, bottom: 0 }}
                  ></div>

                  {/* Animated Dot that follows scroll */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse shadow-xl z-10 transition-all duration-500 ease-out"
                    style={{
                      boxShadow:
                        "0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)",
                    }}
                    id="scrollDot"
                  ></div>

                  <div className="space-y-32">
                    {/* Phone 3 - First Section */}
                    <div
                      className="relative opacity-0 translate-y-12 transition-all duration-700 ease-out"
                      data-scroll-animation
                    >
                      <div className="grid md:grid-cols-2 gap-12 items-center py-16">
                        {/* Phone Image - Left Side */}
                        <div className="order-1 flex justify-center">
                          <div className="transform hover:scale-105 transition-transform duration-300">
                            <Image
                              src="/phone3.png"
                              alt="Agita Interface"
                              width={640}
                              height={640}
                              className="drop-shadow-2xl"
                              priority
                            />
                          </div>
                        </div>

                        {/* Feature Cards - Right Side */}
                        <div className="order-2 space-y-8">
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-200"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Calendar}
                              title="Filtre Festas por Mês"
                              description="Organize e filtre todas as festas mensalmente com nossa interface intuitiva"
                              delay={0}
                            />
                          </div>
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-400"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Star}
                              title="Favorite suas Festas"
                              description="Marque seus eventos favoritos e acesse-os rapidamente quando precisar"
                              delay={100}
                            />
                          </div>
                        </div>
                      </div>
                    </div>


                                        <div
                      className="relative opacity-0 translate-y-12 transition-all duration-700 ease-out"
                      data-scroll-animation
                    >
                      <div className="grid md:grid-cols-2 gap-12 items-center py-16">
                        {/* Phone Image - Left Side */}
                        <div className="order-1 flex justify-center">
                          <div className="transform hover:scale-105 transition-transform duration-300">
                            <Image
                              src="/btnAgitarImg.png"
                              alt="Botão de Agitar"
                              width={440}
                              height={440}
                              className="drop-shadow-2xl"
                              priority
                            />
                          </div>
                        </div>

                        {/* Feature Cards - Right Side */}
                        <div className="order-2 space-y-8">
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-200"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Calendar}
                              title="Agite as melhores festas"
                              description="Se achar que uma festa vai aquecer, então esse é botão que deve clicar"
                              delay={0}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone 2 - Second Section */}
                    <div
                      className="relative opacity-0 translate-y-12 transition-all duration-700 ease-out"
                      data-scroll-animation
                    >
                      <div className="grid md:grid-cols-2 gap-12 items-center py-16">
                        {/* Feature Cards - Left Side */}
                        <div className="order-2 md:order-1 space-y-8">
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-200"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Eye}
                              title="Visualize os Detalhes das Festas"
                              description="Veja todas as informações detalhadas dos eventos de forma clara e organizada"
                              delay={200}
                            />
                          </div>
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-400"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Camera}
                              title="Fotos das Festas Passadas"
                              description="Acesse fotos e memórias dos eventos que já aconteceram na plataforma"
                              delay={300}
                            />
                          </div>
                        </div>

                        {/* Phone Image - Right Side */}
                        <div className="order-1 md:order-2 flex justify-center">
                          <div className="transform hover:scale-105 transition-transform duration-300">
                            <Image
                              src="/phone2.png"
                              alt="ApuApp Detalhes"
                              width={680}
                              height={680}
                              className="drop-shadow-2xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone 4 - Third Section */}
                    <div
                      className="relative opacity-0 translate-y-12 transition-all duration-700 ease-out"
                      data-scroll-animation
                    >
                      <div className="grid md:grid-cols-2 gap-12 items-center py-16">
                        {/* Phone Image - Left Side */}
                        <div className="order-1 flex justify-center">
                          <div className="transform hover:scale-105 transition-transform duration-300">
                            <Image
                              src="/phone4.png"
                              alt="ApuApp Localização"
                              width={560}
                              height={560}
                              className="drop-shadow-2xl"
                            />
                          </div>
                        </div>

                        {/* Feature Cards - Right Side */}
                        <div className="order-2 space-y-8">
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-200"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={MapPin}
                              title="Localize as Festas"
                              description="Encontre facilmente a localização de todas as festas com GPS integrado"
                              delay={400}
                            />
                          </div>
                          <div
                            className="opacity-0 translate-x-8 transition-all duration-700 ease-out delay-400"
                            data-scroll-animation
                          >
                            <FeatureCard
                              icon={Shield}
                              title="Rastreio e Compartilhamento"
                              description="Compartilhe sua localização com segurança e mantenha contato com amigos"
                              delay={500}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-3xl text-center font-bold text-white mb-8">
                  Recursos Adicionais
                </h3>
                {/* Additional Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  <FeatureCard
                    icon={Ticket}
                    title="Compra de Ingressos"
                    description="Compre ingressos diretamente no app com segurança e praticidade"
                    delay={100}
                  />
                  <FeatureCard
                    icon={Users}
                    title="Lista de Amigos"
                    description="Veja quais amigos vão ao evento e planeje encontros"
                    delay={300}
                  />
                  <FeatureCard
                    icon={Star}
                    title="Avaliações"
                    description="Avalie eventos e ajude outros usuários a escolher as melhores festas"
                    delay={400}
                  />
                </div>
              </div>
            )}

            {activeTab === "baixar" && (
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Baixar Agita
                </h2>
                <p className="text-xl text-gray-300 mb-12">
                  Disponível para iOS e Android. Baixe agora e comece a descobrir
                  as melhores festas!
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all flex flex-col items-center">
                    <div className="text-6xl mb-4 flex justify-center">
                      <Image
                        src="/appstore.png"
                        alt="App Store"
                        width={240}
                        height={240}
                        className="drop-shadow-2xl"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">iOS</h3>
                    <p className="text-white/80 mb-6">
                      Compatível com iPhone iOS 12.0 ou superior
                    </p>
                    <Image
                      src="/qrcode.jpg"
                      alt="Imagem de uma festa"
                      width={100}
                      height={100}
                      className="mx-auto mb-10"
                    />
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all flex flex-col items-center">
                    <div className="text-6xl mb-4 flex justify-center">
                      <Image
                        src="/playstore.png"
                        alt="play store"
                        width={240}
                        height={240}
                        className="drop-shadow-2xl"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Android
                    </h3>
                    <p className="text-white/80 mb-6">
                      Compatível com Android 7.0 ou superior
                    </p>
                    <Image
                      src="/qrcode.jpg"
                      alt="Imagem de uma festa"
                      width={100}
                      height={100}
                      className="mx-auto mb-10"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Recursos do App
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">Interface intuitiva</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">Pagamentos seguros</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">Lista de favoritos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">GPS integrado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">Rede social</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-pink-400" />
                      <span className="text-white/80">Sistema de avaliações</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ajuda" && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white bg-clip-text text-transparent text-center">
                  Ajuda & Suporte
                </h2>
                <p className="text-xl text-white/80 mb-12 text-center">
                  Encontre respostas para as perguntas mais comuns ou entre em
                  contato conosco
                </p>

                <div className="space-y-6 mb-12">
                  {[
                    {
                      question: "Como cadastrar uma festa?",
                      answer:
                        "Inicie sessão no site com sua conta, clique em 'Cadastrar Eventos' e preencha todos os campos solicitados com os dados da sua festa. Após salvar, o evento será publicado e ficará disponível para os usuários conforme as regras da plataforma.",
                    },
                    {
                      question: "Onde baixar o aplicativo?",
                      answer:
                        "O aplicativo pode ser baixado diretamente no site, acessando a aba 'Baixar'. Nessa seção você poderá escolher a versão para o seu dispositivo ou escanear o código QR disponibilizado, que o redirecionará para a loja oficial correspondente.",
                    },
                    {
                      question: "O que acontece com as festas que já passaram?",
                      answer:
                        "As festas com data expirada são automaticamente removidas da listagem de eventos. Assim, apenas festas futuras e em andamento permanecem visíveis para os usuários.",
                    },
                    {
                      question: "Como editar o cartaz de um evento?",
                      answer:
                        "A plataforma não oferece recursos de edição de imagens ou cartazes. Caso precise atualizar o material do seu evento, recomendamos excluir o cadastro existente e realizar um novo com o cartaz atualizado.",
                    }
                    ,
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      <h3 className="text-xl font-bold text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-white/80">{faq.answer}</p>
                    </div>
                  ))}
                </div>

                <div style={{justifySelf: "center"}} className="gap-8">
                  <div style={{width: '400px', minWidth: '50px'}} className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Contactos
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-pink-400" />
                        <span className="text-white/80">agitaangola.tech@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-pink-400" />
                        <span className="text-white/80">+244 928 051 534</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Login Modal */}
        <Modal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setLoginState("idle");
            setErrorMessage("");
          }}
          title="Login"
        >
          {loginState === "loading" && (
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="text-white mt-4">Processando login...</p>
            </div>
          )}

          {loginState === "success" && (
            <div className="text-center py-8">
              <SuccessIcon />
              <p className="text-green-400 mt-4 font-semibold">
                {successMessage}
              </p>
            </div>
          )}

          {loginState === "error" && (
            <div className="text-center py-4">
              <ErrorIcon />
              <p className="text-red-400 mt-4 font-semibold">{errorMessage}</p>
            </div>
          )}

          {(loginState === "idle" || loginState === "error" || loginState === "loading") && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-pink-400 focus:outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                required
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-pink-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loginState === "loading"}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                Entrar
              </button>
            </form>
          )}
        </Modal>

        {/* Register Modal */}
        <Modal
          isOpen={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            setRegisterState("idle");
            setErrorMessage("");
          }}
          title="Cadastrar"
        >
          {registerState === "loading" && (
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="text-white mt-4">Processando cadastro...</p>
            </div>
          )}

          {registerState === "success" && (
            <div className="text-center py-8">
              <SuccessIcon />
              <p className="text-green-400 mt-4 font-semibold">
                {successMessage}
              </p>
            </div>
          )}

          {registerState === "error" && (
            <div className="text-center py-4">
              <ErrorIcon />
              <p className="text-red-400 mt-4 font-semibold">{errorMessage}</p>
            </div>
          )}

          {(registerState === "idle" || registerState === "error" || registerState === "loading") && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Nome"
                required
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-pink-400 focus:outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-pink-400 focus:outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                required
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-pink-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={registerState === "loading"}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                Cadastrar
              </button>
            </form>
          )}
        </Modal>

        {/* Social Media Links (lateral) */}
        <div className="fixed right-6 bottom-1/2 z-50 flex flex-col gap-4 items-center">
          <a
            href="https://www.instagram.com/agita.angola/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="group bg-white/10 hover:bg-pink-600/80 transition-colors rounded-full p-3 shadow-lg"
            style={{ backdropFilter: "blur(6px)" }}
          >
            <Image
              src={InstaIcon}
              alt="Instagram"
              width={28}
              height={28}
              className="group-hover:scale-110 transition-transform"
            />
          </a>
          <a
            href="https://www.facebook.com/share/1CGsESkzvo/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="group bg-white/10 hover:bg-blue-600/80 transition-colors rounded-full p-3 shadow-lg"
            style={{ backdropFilter: "blur(6px)" }}
          >
            <Image
              src={FacebookIcon}
              alt="Facebook"
              width={28}
              height={28}
              className="group-hover:scale-110 transition-transform"
            />
          </a>
        </div>

        {/* Botão flutuante do WhatsApp (canto inferior direito) */}
        <div className="fixed right-6 bottom-10 z-50">
          <a
            href="https://wa.me/244928051534"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="group bg-green-500/60 hover:bg-green-600 transition-colors rounded-full p-4 shadow-2xl flex items-center justify-center"
            style={{ boxShadow: "0 4px 24px 0 rgba(37, 211, 102, 0.4)" }}
          >
            <Image
              src={WhatsappIcon}
              alt="WhatsApp"
              width={30}
              height={30}
              className="group-hover:scale-110 transition-transform"
            />
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-24 py-12 border-t border-white/20 text-center text-white/60 text-sm select-none">
          <p>Desenvolvido por - Alcino Jaime</p>
          &copy; {new Date().getFullYear()} Agita. Todos os direitos reservados.
        </footer>
      </div>
    </>
  );
};

export default ApuAppWebsite;
