import React, { useState, useRef, FormEvent, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  MapPin,
  Calendar,
  FileText,
  ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Clock,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Ajuste o caminho conforme sua estrutura
import { useRouter } from 'next/navigation';
import Image from "next/image";

// Types
interface FormData {
  nome: string;
  data: string;
  hora: string;
  descricao: string;
  localizacao: string;
  linkBilhete: string;
  preco: string;      // novo campo
  contacto: string;   // novo campo
}

interface Images {
  cartaz: File | null;
  espaco: File | null;
  festa: File | null;
  pessoa: File | null;
}

interface ImagePreviews {
  cartaz: string | null;
  espaco: string | null;
  festa: string | null;
  pessoa: string | null;
}

interface FileInputRefs {
  cartaz: React.RefObject<HTMLInputElement | null>;
  espaco: React.RefObject<HTMLInputElement | null>;
  festa: React.RefObject<HTMLInputElement | null>;
  pessoa: React.RefObject<HTMLInputElement | null>;
}

type ImageType = keyof Images;
type SubmitStatus = "success" | "error" | null;

interface ImageUploadProps {
  type: ImageType;
  title: string;
  description: string;
  required?: boolean;
}

const CadastroFesta: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    data: "",
    hora: "",
    descricao: "",
    localizacao: "",
    linkBilhete: "",
    preco: "",      // novo campo
    contacto: "",   // novo campo
  });

  const [images, setImages] = useState<Images>({
    cartaz: null,
    espaco: null,
    festa: null,
    pessoa: null,
  });

  const [imagesPreviews, setImagesPreviews] = useState<ImagePreviews>({
    cartaz: null,
    espaco: null,
    festa: null,
    pessoa: null,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Estados de autenticação
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginState, setLoginState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [registerState, setRegisterState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const fileInputRefs: FileInputRefs = {
    cartaz: useRef<HTMLInputElement>(null),
    espaco: useRef<HTMLInputElement>(null),
    festa: useRef<HTMLInputElement>(null),
    pessoa: useRef<HTMLInputElement>(null),
  };

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsLoggedIn(true);
          setUser({
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "Usuário",
            email: session.user.email ?? "",
          });
        } else {
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setShowAuthModal(true);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listener para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Usuário",
          email: session.user.email ?? "",
        });
        setShowAuthModal(false);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setShowAuthModal(true);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Função para login
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginState("loading");
    setErrorMessage("");

    const formDataAuth = new FormData(e.currentTarget);
    const email = formDataAuth.get("email") as string;
    const password = formDataAuth.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginState("error");
        setErrorMessage(error.message);
        setTimeout(() => setLoginState("idle"), 3000);
        return;
      }

      setLoginState("success");
      setSuccessMessage("Login realizado com sucesso!");
    } catch (error) {
      console.error("Erro no login:", error);
      setLoginState("error");
      setErrorMessage("Erro inesperado no login");
      setTimeout(() => setLoginState("idle"), 3000);
    }
  };

  // Função para cadastro
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterState("loading");
    setErrorMessage("");

    const formDataAuth = new FormData(e.currentTarget);
    const name = formDataAuth.get("name") as string;
    const email = formDataAuth.get("email") as string;
    const password = formDataAuth.get("password") as string;

    try {
      const {  error } = await supabase.auth.signUp({
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
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setRegisterState("error");
      setErrorMessage("Erro inesperado no cadastro");
      setTimeout(() => setRegisterState("idle"), 3000);
    }
  };

  const router = useRouter();

  // Função para comprimir e converter imagem para JPG
  const compressImage = (
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Converter para blob JPG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Função para lidar com seleção de arquivos
  const handleFileSelect = async (
    type: ImageType,
    file: File | null
  ): Promise<void> => {
    if (!file) return;

    try {
      // Comprimir imagem
      const compressedFile = await compressImage(file);

      // Criar preview
      const previewUrl = URL.createObjectURL(compressedFile);

      // Atualizar estados
      setImages((prev) => ({ ...prev, [type]: compressedFile as File }));
      setImagesPreviews((prev) => ({ ...prev, [type]: previewUrl }));
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setErrorMessage("Erro ao processar a imagem. Tente novamente.");
    }
  };

  // Função para remover imagem
  const removeImage = (type: ImageType): void => {
    if (imagesPreviews[type]) {
      URL.revokeObjectURL(imagesPreviews[type]!);
    }
    setImages((prev) => ({ ...prev, [type]: null }));
    setImagesPreviews((prev) => ({ ...prev, [type]: null }));
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current!.value = "";
    }
  };

  // Função para upload real para Supabase
  const uploadToSupabase = async (
    file: File,
    fileName: string
  ): Promise<string> => {
    try {
      const { error } = await supabase.storage
        .from("festa-images") // Nome do bucket no Supabase Storage
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from("festa-images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Erro no upload:", error);
      throw error;
    }
  };

  // Função para validar URL
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return true; // URL vazia é válida (campo opcional)
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Função para formatar data e hora para datetime-local
  const combineDateAndTime = (date: string, time: string): string => {
    if (!date || !time) return "";
    return `${date}T${time}`;
  };


  // Função para enviar formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!user) {
      setErrorMessage("Você precisa estar logado para cadastrar um evento.");
      return;
    }

    // Validações
    if (!formData.nome.trim()) {
      setErrorMessage("Por favor, preencha o nome do Apupu");
      return;
    }

    if (!formData.data || !formData.hora) {
      setErrorMessage("Por favor, selecione a data e hora do Apupu");
      return;
    }

    if (formData.linkBilhete && !isValidUrl(formData.linkBilhete)) {
      setErrorMessage("Por favor, insira uma URL válida para o link de bilhetes");
      return;
    }

    if (!images.cartaz) {
      setErrorMessage("Por favor, selecione o cartaz do evento");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const imageUrls: Record<string, string> = {};
      const totalImages = Object.values(images).filter(Boolean).length;
      let uploadedCount = 0;

      // Upload das imagens
      for (const [type, file] of Object.entries(images)) {
        if (file) {
          const fileName = `${user.id}/${type}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}.jpg`;
          const url = await uploadToSupabase(file, fileName);
          imageUrls[type] = url;

          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalImages) * 100));
        }
      }

      // Combinar data e hora
      const datetimeString = combineDateAndTime(formData.data, formData.hora);

      // Dados para enviar ao Supabase
      const festaData = {
        nome: formData.nome,
        data: datetimeString,
        descricao: formData.descricao,
        localizacao: formData.localizacao,
        linkBilhete: formData.linkBilhete || null,
        preco: formData.preco || "",         // novo campo
        contacto: formData.contacto || "",   // novo campo
        cartaz_url: imageUrls.cartaz,
        imagem_espaco_url: imageUrls.espaco || null,
        imagem_festa_url: imageUrls.festa || null,
        imagem_pessoa_url: imageUrls.pessoa || null,
        organizador_id: user.id,
        created_at: new Date().toISOString(),
        status: "aprovado", // Padrão para eventos novos
      };

      // Inserir no Supabase
      const { error } = await supabase
        .from("festas") // Nome da tabela
        .insert([festaData]);

      if (error) {
        throw error;
      }

      setSubmitStatus("success");

      // Limpar formulário após sucesso
      setTimeout(() => {
        setFormData({ 
          nome: "", 
          data: "", 
          hora: "", 
          descricao: "", 
          localizacao: "",
          linkBilhete: "",
          preco: "",
          contacto: ""
        });
        Object.values(imagesPreviews).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
        setImages({ cartaz: null, espaco: null, festa: null, pessoa: null });
        setImagesPreviews({
          cartaz: null,
          espaco: null,
          festa: null,
          pessoa: null,
        });
        setSubmitStatus(null);
      }, 3000);
    } catch (error) {
      console.error("Erro ao cadastrar festa:", error);
      setSubmitStatus("error");
      setErrorMessage("Erro ao cadastrar evento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Componentes visuais para estados de autenticação
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  );

  const SuccessIcon = () => (
    <div className="flex items-center justify-center">
      <div className="rounded-full bg-gradient-to-r from-green-400 to-green-600 p-3 animate-bounce">
        <Check className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  const ErrorIcon = () => (
    <div className="flex items-center justify-center">
      <div className="rounded-full bg-gradient-to-r from-red-400 to-red-600 p-3 animate-pulse">
        <X className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  // Modal de autenticação
  const AuthModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-600">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Acesso Necessário
          </h2>
          <p className="text-gray-300">
            Para cadastrar um evento, você precisa fazer login
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              authMode === "login"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-black/40 text-gray-300 hover:bg-black/60"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode("register")}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              authMode === "register"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-black/40 text-gray-300 hover:bg-black/60"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {authMode === "login" ? (
          <>
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
                <p className="text-red-400 mt-4 font-semibold">
                  {errorMessage}
                </p>
              </div>
            )}

            {(loginState === "idle" || loginState === "error") && (
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
                  disabled={loginState !== "idle"}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Entrar
                </button>
              </form>
            )}
          </>
        ) : (
          <>
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
                <p className="text-red-400 mt-4 font-semibold">
                  {errorMessage}
                </p>
              </div>
            )}

            {(registerState === "idle" || registerState === "error") && (
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
                  disabled={registerState !== "idle"}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Cadastrar
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Componente para upload de imagem
  const ImageUpload: React.FC<ImageUploadProps> = ({
    type,
    title,
    description,
    required = false,
  }) => (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-gray-600">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {title} {required && <span className="text-red-400">*</span>}
          </h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>

      {imagesPreviews[type] ? (
        <div className="relative group">
          <Image
            src={imagesPreviews[type]!}
            alt={`Preview ${title}`}
            width={800}
            height={400}
            className="w-full h-48 object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
            <button
              type="button"
              onClick={() => removeImage(type)}
              className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRefs[type].current?.click()}
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors group"
        >
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4 group-hover:text-purple-400 transition-colors" />
          <p className="text-gray-400 group-hover:text-white transition-colors">
            Clique para selecionar uma imagem
          </p>
          <p className="text-gray-500 text-sm mt-2">
            JPG, PNG ou WEBP (máx. 10MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRefs[type]}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-pink-400/10 via-purple-500/10 to-blue-400/10 rounded-full blur-3xl animate-pulse opacity-20"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Modal de autenticação */}
      {showAuthModal && <AuthModal />}

      {/* Conteúdo principal */}
      {isLoggedIn && (
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex flex-row items-center justify-between self-end">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 px-12 py-4 font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowLeft className="w-6 h-6 text-purple-400" />
              Voltar a página inicial
            </button>

            <button onClick={() => router.push('/minhasFestas')} className="flex items-center gap-2 px-12 py-4 font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              Ver minhas Festas
              <ArrowRight className="w-6 h-6 text-purple-400" />
            </button>
          </div>

          <div className="text-center mb-12">
            <Image
              src="/logo.png"
              alt="Imagem de uma festa"
              width={300}
              height={200}
              className="mx-auto mb-10"
            />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white bg-clip-text text-transparent">
              Cadastre sua Festa
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Olá, {user?.name}! Preencha as informações do seu evento e
              compartilhe com milhares de usuários
            </p>
          </div>

          {/* Mensagem de erro geral */}
          {errorMessage && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-200">{errorMessage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Informações Básicas */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-gray-600">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-400" />
                Informações Básicas
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Nome da Festa <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: Drenalândia"
                    className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Data e Hora separadas com design melhorado */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Data da Festa <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, data: e.target.value }))
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Hora da Festa <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.hora}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hora: e.target.value }))
                      }
                      className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Localização
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.localizacao}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          localizacao: e.target.value,
                        }))
                      }
                      placeholder="Ex: Marginal de Luanda, Ilha do Cabo"
                      className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Link para Compra de Bilhetes
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.linkBilhete}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          linkBilhete: e.target.value,
                        }))
                      }
                      placeholder="https://exemplo.com/bilhetes"
                      className="w-full pl-12 pr-12 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                    />
                    <ExternalLink className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Link onde os usuários podem comprar bilhetes para o evento (opcional)
                  </p>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Preço do Evento
                  </label>
                  <input
                    type="text"
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, preco: e.target.value }))
                    }
                    placeholder="Ex: 5000 Kz"
                    className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Informações de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contacto: e.target.value }))
                    }
                    placeholder="Ex: +244 999 999 999"
                    className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-semibold mb-2">
                    Descrição do Evento
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descreva seu evento, atrações, horários, dress code..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-gray-600 focus:border-purple-400 focus:outline-none resize-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Upload de Imagens */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-purple-400" />
                Imagens do Evento
              </h2>

              {/* Cartaz - Obrigatório */}
              <ImageUpload
                type="cartaz"
                title="Cartaz do Evento"
                description="Imagem principal que será exibida nos cards do evento"
                required={true}
              />

              {/* Imagens Opcionais */}
              <div className="grid md:grid-cols-3 gap-6">
                <ImageUpload
                  type="espaco"
                  title="Foto do Espaço"
                  description="Imagem mostrando o local do evento"
                />

                <ImageUpload
                  type="festa"
                  title="Festa Acontecendo"
                  description="Foto da atmosfera da festa"
                />

                <ImageUpload
                  type="pessoa"
                  title="Pessoas na Festa"
                  description="Foto de pessoas curtindo o evento"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">
                      Dicas para melhores fotos:
                    </p>
                    <ul className="space-y-1 text-blue-300">
                      <li>• Use imagens com boa iluminação e qualidade</li>
                      <li>• O cartaz deve destacar o nome e data do evento</li>
                      <li>
                        • As imagens serão automaticamente otimizadas e
                        convertidas para JPG
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="text-center pt-8">
              {isSubmitting && (
                <div className="mb-6">
                  <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-gray-600 max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      <span className="text-white">Enviando evento...</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      {uploadProgress}% concluído
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === "success" && (
                <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-200">
                      Evento cadastrado com sucesso!
                    </span>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-200">
                      Erro ao cadastrar evento. Tente novamente.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSubmitting
                    ? "bg-gray-600"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-2xl hover:shadow-purple-500/25"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  "Cadastrar Festa"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CadastroFesta;