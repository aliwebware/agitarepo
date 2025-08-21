import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Users,
  Settings,
  Loader2,
  X,
  ArrowLeft,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image"; // Importando o componente Image do Next.js

// Types
interface Festa {
  id: string;
  nome: string;
  data: string;
  descricao: string;
  localizacao: string;
  cartaz_url: string;
  imagem_espaco_url?: string;
  imagem_festa_url?: string;
  imagem_pessoa_url?: string;
  status: "pendente" | "aprovado" | "rejeitado";
  created_at: string;
  organizador_id: string;
  views?: number;
  interessados?: number;
  preco?: string;
  contacto?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type FilterStatus = "todos" | "pendente" | "aprovado" | "rejeitado";
type SortBy = "data" | "nome" | "created_at" | "status";

const MinhasFestas: React.FC = () => {
  const [festas, setFestas] = useState<Festa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("data");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedFesta, setSelectedFesta] = useState<Festa | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Verificar se há usuário logado ao carregar a página
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "Usuário",
            email: session.user.email || "",
          });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setError("Erro ao carregar dados do usuário");
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
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Usuário",
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

      // Mova o hook useCallback para fora do componente DetailsModal, logo acima dele:
  const handleOpenEditModal = useCallback(() => {
    setShowDetailsModal(false);
    setShowEditModal(true);
  }, []); // Dependências vazias, pois os setters são estáveis

  // Modal de Detalhes

  // Carregar festas quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadFestas(user.id);
    }
  }, [user?.id]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Carregar festas do Supabase
  const loadFestas = async (userId: string) => {
    try {
      setLoading(true);
      setError("");

      console.log("Tentando carregar festas para o userId:", userId);

      const { data, error } = await supabase
        .from("festas")
        .select("*")
        .eq("organizador_id", userId)
        .order("created_at", { ascending: false });

      console.log("Dados recebidos:", data);
      console.log("Erro do Supabase:", error);

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      setFestas(data || []);
    } catch (err) {
      console.error("Erro ao carregar festas:", err);
      setError("Erro ao carregar suas festas. Tente novamente.");
      setFestas([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar lista
  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    await loadFestas(user.id);
    setIsRefreshing(false);
  };

  // Função para deletar festa
  const handleDelete = async (festa: Festa) => {
    if (!festa || !user?.id) return;

    try {
      setIsDeleting(true);
      setError("");

      // Deletar imagens do storage primeiro, antes de deletar o registro
      const imagesToDelete = [
        festa.cartaz_url,
        festa.imagem_espaco_url,
        festa.imagem_festa_url,
        festa.imagem_pessoa_url,
      ].filter(Boolean);

      console.log("URLs das imagens para deletar:", imagesToDelete);

      for (const imageUrl of imagesToDelete) {
        if (imageUrl && imageUrl.includes("festa-images")) {
          try {
            const urlParts = imageUrl.split("/festa-images/");
            if (urlParts.length > 1) {
              const filePath = urlParts[1];

              console.log("Tentando deletar arquivo:", filePath);

              const { error: storageError } = await supabase.storage
                .from("festa-images")
                .remove([filePath]);

              if (storageError) {
                console.error(
                  "Erro ao deletar imagem do storage:",
                  storageError
                );
              } else {
                console.log("Imagem deletada com sucesso:", filePath);
              }
            }
          } catch (storageError) {
            console.warn("Erro ao processar URL da imagem:", storageError);
          }
        }
      }

      // Deletar registro da festa após deletar as imagens
      const { error: deleteError } = await supabase
        .from("festas")
        .delete()
        .eq("id", festa.id)
        .eq("organizador_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar estado local
      setFestas((prev) => prev.filter((f) => f.id !== festa.id));
      setShowDeleteModal(false);
      setSelectedFesta(null);
      setSuccessMessage("Festa excluída com sucesso!");

      console.log("Festa e imagens deletadas com sucesso");
    } catch (err) {
      console.error("Erro ao deletar festa:", err);
      setError("Erro ao excluir a festa. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para redirecionar para criar nova festa
  const handleCreateNew = () => {
    router.push("/registrarApupu");
  };

  // Função para formatar data para input datetime-local
  const formatDateForInput = (dateString: string): string => {
    try {
      if (!dateString) return "";

      // Se já está no formato correto, retornar como está
      if (dateString.includes('T') && dateString.length >= 16) {
        return dateString.slice(0, 16);
      }

      // Converter de formato ISO para datetime-local
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateString);
        return "";
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };

  // Filtrar e ordenar festas
  const filteredAndSortedFestas = useMemo(() => {
    return festas
      .filter((festa) => {
        const matchesSearch =
          festa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          festa.localizacao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === "todos" || festa.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "data":
            return new Date(a.data).getTime() - new Date(b.data).getTime();
          case "nome":
            return a.nome.localeCompare(b.nome);
          case "created_at":
            return (
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          case "status":
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [festas, searchTerm, filterStatus, sortBy]);

  // Função para formatar data e hora
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Componente de Status
  const StatusBadge: React.FC<{ status: Festa["status"] }> = ({ status }) => {
    const configs = {
      pendente: {
        bg: "bg-yellow-900/30",
        border: "border-yellow-500/50",
        text: "text-yellow-300",
        icon: Clock,
      },
      aprovado: {
        bg: "bg-green-900/30",
        border: "border-green-500/50",
        text: "text-green-300",
        icon: CheckCircle,
      },
      rejeitado: {
        bg: "bg-red-900/30",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: AlertCircle,
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.border}`}
      >
        <Icon className={`w-4 h-4 ${config.text}`} />
        <span className={`text-sm font-medium ${config.text} capitalize`}>
          {status}
        </span>
      </div>
    );
  };

  // Custom Date Time Picker Component - CORRIGIDO
  interface CustomDateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
  }

  const CustomDateTimePicker = React.memo(function CustomDateTimePicker(
    props: CustomDateTimePickerProps
  ) {
    const { value, onChange } = props;
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState("");
    const [tempTime, setTempTime] = useState("");

    useEffect(() => {
      if (value) {
        // Tratar o valor como datetime-local (sem conversão de timezone)
        if (value.includes('T')) {
          const [dateStr, timeStr] = value.split('T');
          setTempDate(dateStr);
          setTempTime(timeStr.slice(0, 5)); // Pegar apenas HH:MM
        } else {
          // Fallback para formato de data simples
          const date = new Date(value);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');

          setTempDate(`${year}-${month}-${day}`);
          setTempTime(`${hours}:${minutes}`);
        }
      } else {
        setTempDate("");
        setTempTime("");
      }
    }, [value]);

    const handleConfirm = useCallback(() => {
      if (tempDate && tempTime) {
        // Criar datetime-local sem conversão de timezone
        const combinedDateTime = `${tempDate}T${tempTime}:00`;
        onChange(combinedDateTime);
        setShowPicker(false);
      }
    }, [tempDate, tempTime, onChange]);

    const formatDisplayValue = useCallback((dateString: string) => {
      if (!dateString) return "Selecionar data e hora";

      try {
        if (dateString.includes('T')) {
          const [datePart, timePart] = dateString.split('T');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes] = timePart.split(':');

          return `${day}/${month}/${year} às ${hours}:${minutes}`;
        } else {
          // Fallback para formato antigo
          const date = new Date(dateString);
          return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        return "Data inválida";
      }
    }, []);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white hover:border-purple-400 focus:border-purple-400 focus:outline-none transition-colors flex items-center justify-between"
        >
          <span className={value ? "text-white" : "text-gray-400"}>
            {formatDisplayValue(value)}
          </span>
          <Calendar className="w-5 h-5 text-purple-400" />
        </button>

        {showPicker && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-gray-600 rounded-2xl p-6 shadow-2xl z-50">
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-center mb-4">
                Selecionar Data e Hora
              </h4>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="flex-1 bg-gray-600/50 hover:bg-gray-600/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors border border-gray-500/30"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!tempDate || !tempTime}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });
  CustomDateTimePicker.displayName = "CustomDateTimePicker";

  // Modal de Edição Isolado - CORRIGIDO
  const EditModal = React.memo(function EditModal() {
    const [editForm, setEditForm] = useState({
      nome: "",
      data: "",
      descricao: "",
      localizacao: "",
    });
    const [localError, setLocalError] = useState("");

    // Inicializar formulário quando selectedFesta mudar
    useEffect(() => {
      if (selectedFesta && showEditModal) {
        setEditForm({
          nome: selectedFesta.nome || "",
          data: formatDateForInput(selectedFesta.data),
          descricao: selectedFesta.descricao || "",
          localizacao: selectedFesta.localizacao || "",
        });
        setLocalError("");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showEditModal]);

    const handleFormChange = useCallback(
      (field: keyof typeof editForm, value: string) => {
        setEditForm((prev) => ({
          ...prev,
          [field]: value,
        }));
        if (localError) setLocalError("");
      },
      [localError]
    );

    const handleUpdateFesta = useCallback(async () => {
      if (!selectedFesta || !user?.id) return;

      try {
        setIsUpdating(true);
        setLocalError("");

        // Validações básicas
        if (!editForm.nome.trim()) {
          setLocalError("Nome da festa é obrigatório");
          return;
        }

        if (!editForm.data) {
          setLocalError("Data da festa é obrigatória");
          return;
        }

        if (!editForm.localizacao.trim()) {
          setLocalError("Localização da festa é obrigatória");
          return;
        }

        console.log("Dados sendo enviados:", {
          nome: editForm.nome.trim(),
          data: editForm.data,
          descricao: editForm.descricao.trim(),
          localizacao: editForm.localizacao.trim(),
        });

        // Atualizar no Supabase
        const { data, error } = await supabase
          .from("festas")
          .update({
            nome: editForm.nome.trim(),
            data: editForm.data,
            descricao: editForm.descricao.trim(),
            localizacao: editForm.localizacao.trim(),
          })
          .eq("id", selectedFesta.id)
          .eq("organizador_id", user.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || "Erro ao atualizar festa");
        }

        if (!data) {
          throw new Error("Nenhum dado retornado após atualização");
        }

        setFestas((prev) =>
          prev.map((festa) =>
            festa.id === selectedFesta.id ? { ...festa, ...data } : festa
          )
        );

        setShowEditModal(false);
        setSelectedFesta(null);
        setEditForm({ nome: "", data: "", descricao: "", localizacao: "" });
        setLocalError("");
        setSuccessMessage("Festa atualizada com sucesso!");
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Erro ao atualizar a festa. Tente novamente.";
        setLocalError(errorMsg);
      } finally {
        setIsUpdating(false);
      }
    }, [editForm]); // Remova selectedFesta, user das deps

    const handleCloseModal = useCallback(() => {
      setShowEditModal(false);
      setSelectedFesta(null);
      setEditForm({ nome: "", data: "", descricao: "", localizacao: "" });
      setLocalError("");
    }, []);

    if (!selectedFesta || !showEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black/95 backdrop-blur-xl rounded-2xl border border-gray-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Editar Festa
                </h2>
                <p className="text-gray-400">
                  Edite as informações básicas da festa
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Error Message dentro do modal */}
            {localError && (
              <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-200">{localError}</span>
                  <button
                    onClick={() => setLocalError("")}
                    className="ml-auto p-1 hover:bg-red-800/30 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Formulário */}
            <div className="space-y-6">
              {/* Nome da Festa */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Nome da Festa *
                </label>
                <input
                  type="text"
                  value={editForm.nome}
                  onChange={(e) => handleFormChange('nome', e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  placeholder="Digite o nome da festa"
                  required
                />
              </div>

              {/* Data e Hora */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Data e Hora *
                </label>
                <CustomDateTimePicker
                  value={editForm.data}
                  onChange={(value) => handleFormChange('data', value)}
                />
              </div>

              {/* Localização */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Localização *
                </label>
                <input
                  type="text"
                  value={editForm.localizacao}
                  onChange={(e) => handleFormChange('localizacao', e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  placeholder="Digite o local da festa"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={editForm.descricao}
                  onChange={(e) => handleFormChange('descricao', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none transition-colors"
                  placeholder="Descreva sua festa (opcional)"
                />
              </div>

              {/* Nota sobre limitações */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Image src="/icons/info.svg" alt="Informação" width={20} height={20} className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-300 font-semibold mb-1">
                      Edição Rápida
                    </h4>
                    <p className="text-blue-200 text-sm">
                      Esta edição permite alterar apenas informações básicas.
                      As imagens da festa não podem ser alteradas por aqui.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleCloseModal}
                disabled={isUpdating}
                className="flex-1 bg-gray-600/50 hover:bg-gray-600/70 backdrop-blur-sm text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-500/30"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleUpdateFesta}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });
  EditModal.displayName = "EditModal";

  // Função para deletar automaticamente festas passadas
  const deletePastFestas = useCallback(async () => {
    if (!user?.id) return;

    try {
      const now = new Date();

      // Filtra festas passadas
      const pastFestas = festas.filter((festa) => {
        const festaDate = new Date(festa.data);
        return festaDate < now;
      });

      if (pastFestas.length === 0) return;

      // Deleta cada festa passada
      for (const festa of pastFestas) {
        // Deletar imagens do storage
        const imagesToDelete = [
          festa.cartaz_url,
          festa.imagem_espaco_url,
          festa.imagem_festa_url,
          festa.imagem_pessoa_url,
        ].filter(Boolean);

        for (const imageUrl of imagesToDelete) {
          if (imageUrl && imageUrl.includes("festa-images")) {
            const urlParts = imageUrl.split("/festa-images/");
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              await supabase.storage.from("festa-images").remove([filePath]);
            }
          }
        }

        // Deletar registro da festa
        await supabase
          .from("festas")
          .delete()
          .eq("id", festa.id)
          .eq("organizador_id", user.id);
      }

      // Atualiza estado local
      setFestas((prev) =>
        prev.filter((festa) => {
          const festaDate = new Date(festa.data);
          return festaDate >= now;
        })
      );
    } catch (err) {
      console.error("Erro ao deletar festas passadas:", err);
    }
  }, [festas, user?.id]);

  // Chama a função automaticamente ao carregar festas
  useEffect(() => {
    if (festas.length > 0 && user?.id) {
      deletePastFestas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festas, user?.id]);

  // Se não há usuário logado, não mostrar a página
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }


  const DetailsModal = () => {
    if (!selectedFesta || !showDetailsModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-gray-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedFesta.nome}
                </h2>
                <StatusBadge status={selectedFesta.status} />
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Imagem */}
            {selectedFesta.cartaz_url && (
              <div className="mb-6">
                <Image
                  src={selectedFesta.cartaz_url}
                  alt={selectedFesta.nome}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Informações */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>
                  {formatDate(selectedFesta.data)} às{" "}
                  {formatTime(selectedFesta.data)}
                </span>
              </div>

              {selectedFesta.localizacao && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span>{selectedFesta.localizacao}</span>
                </div>
              )}

              {(selectedFesta.views || selectedFesta.interessados) && (
                <div className="flex items-center gap-6 text-gray-300">
                  {selectedFesta.views && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span>{selectedFesta.views} visualizações</span>
                    </div>
                  )}
                  {selectedFesta.interessados && (
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <span>{selectedFesta.interessados} interessados</span>
                    </div>
                  )}
                </div>
              )}

              {selectedFesta.descricao && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Descrição</h4>
                  <p className="text-gray-300">{selectedFesta.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="block text-gray-400 text-sm">Preço:</span>
                  <span className="text-white font-semibold">
                    {selectedFesta.preco && selectedFesta.preco.trim() !== ""
                      ? selectedFesta.preco
                      : "-----"}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 text-sm">Contacto:</span>
                  <span className="text-white font-semibold">
                    {selectedFesta.contacto && selectedFesta.contacto.trim() !== ""
                      ? selectedFesta.contacto
                      : "-----"}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Criado em {formatDate(selectedFesta.created_at)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={handleOpenEditModal}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowDeleteModal(true);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal de Confirmação de Exclusão
  const DeleteModal = () => {
    if (!selectedFesta || !showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-gray-600 max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Excluir Festa</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir &quot;{selectedFesta.nome}&quot;?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedFesta(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(selectedFesta)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Se não há usuário logado, não mostrar a página
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-pink-400/10 via-purple-500/10 to-blue-400/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* ESQUERDA – Botão Voltar */}
            <div className="w-full md:w-1/3 flex justify-start">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-6 h-6 text-purple-400" />
                Voltar à página inicial
              </button>
            </div>

            {/* CENTRO – Título e Descrição */}
            <div className="w-full md:w-1/3 text-center">
              <Image
                src="/logo.png"
                alt="Imagem de uma festa"
                width={300}
                height={200}
                className="mx-auto mb-10"
              />
              <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white bg-clip-text text-transparent">
                Minhas Festas
              </h1>
              <p className="text-gray-300">
                Gerencie seus eventos cadastrados, {user.name}
              </p>
            </div>

            {/* DIREITA – Botões de ação */}
            <div className="w-full md:w-1/3 flex justify-end gap-3 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-black/40 backdrop-blur-md border border-gray-600 hover:border-purple-500 px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </button>

              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Festa
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-xl p-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage("")}
                className="ml-auto p-1 hover:bg-green-800/30 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto p-1 hover:bg-red-800/30 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-gray-600 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou localização..."
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
                className="bg-black/40 border border-gray-600 rounded-lg text-white px-3 py-2 focus:border-purple-400 focus:outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-black/40 border border-gray-600 rounded-lg text-white px-3 py-2 focus:border-purple-400 focus:outline-none"
              >
                <option value="data">Data do Evento</option>
                <option value="nome">Nome</option>
                <option value="created_at">Data de Criação</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-gray-600 animate-pulse"
              >
                <div className="bg-gray-700 h-48 rounded-xl mb-4"></div>
                <div className="space-y-3">
                  <div className="bg-gray-700 h-4 rounded"></div>
                  <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-700 h-8 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Festas List */}
            {filteredAndSortedFestas.length === 0 ? (
              <div className="text-center py-12">
                <Image src="/icons/info.svg" alt="Sem festas" width={64} height={64} className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {festas.length === 0
                    ? "Nenhuma festa cadastrada"
                    : "Nenhuma festa encontrada"}
                </h3>
                <p className="text-gray-400">
                  {festas.length === 0
                    ? "Comece criando sua primeira festa!"
                    : "Tente ajustar os filtros de busca"}
                </p>
                {festas.length === 0 && (
                  <button
                    onClick={handleCreateNew}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeira Festa
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedFestas.map((festa, index) => (
                  <div
                    key={festa.id}
                    className="bg-black/40 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-600 hover:border-purple-500/50 transition-all duration-300 group animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      {festa.cartaz_url ? (
                        <Image
                          src={festa.cartaz_url}
                          alt={festa.nome}
                          width={800}
                          height={400}
                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                          <Image src="/icons/info.svg" alt="Sem imagem" width={48} height={48} className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <StatusBadge status={festa.status} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                        {festa.nome}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>
                            {formatDate(festa.data)} - {formatTime(festa.data)}
                          </span>
                        </div>

                        {festa.localizacao && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <span className="truncate">
                              {festa.localizacao}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-4">
                          {festa.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{festa.views}</span>
                            </div>
                          )}
                          {festa.interessados && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{festa.interessados}</span>
                            </div>
                          )}
                        </div>
                        <span>Criado: {formatDate(festa.created_at)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFesta(festa);
                            setShowDetailsModal(true);
                          }}
                          className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>

                        <button
                          onClick={() => {
                            setSelectedFesta(festa);
                            setShowEditModal(true);
                          }}
                          className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>

                        <button
                          onClick={() => {
                            setSelectedFesta(festa);
                            setShowDeleteModal(true);
                          }}
                          className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {festas.length > 0 && (
              <div className="mt-8 bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {festas.length}
                    </div>
                    <div className="text-gray-400">Total de Eventos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {festas.filter((f) => f.status === "aprovado").length}
                    </div>
                    <div className="text-gray-400">Aprovados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {festas.filter((f) => f.status === "pendente").length}
                    </div>
                    <div className="text-gray-400">Pendentes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {festas.filter((f) => f.status === "rejeitado").length}
                    </div>
                    <div className="text-gray-400">Rejeitados</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <EditModal />
        <DetailsModal />
        <DeleteModal />
      </div>
    </div>
  );
};

export default MinhasFestas;