import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RepositorioMovimentacao } from '@/repositorios/repositorioMovimentacao';
import { RepositorioCarteira } from '@/repositorios/repositorioCarteira';
import { Movimentacao, TipoMovimentacao, FrequenciaMovimentacao } from '@/dominio/Movimentacao';
import { Carteira } from '@/dominio/Carteira';
import { ArrowUpCircle, ArrowDownCircle, Plus, Edit, Trash2, Calendar, DollarSign, Repeat, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TipoOrdenacao = 'data-recente' | 'data-antiga' | 'valor-maior' | 'valor-menor' | 'vencimento-proximo' | 'vencimento-distante';

/**
 * Página de gerenciamento de movimentações financeiras
 * Permite criar, editar, excluir e listar movimentações (receitas e despesas)
 */
export default function Movimentacoes() {
  const { toast } = useToast();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [movimentacaoEditando, setMovimentacaoEditando] = useState<Movimentacao | null>(null);
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao>('data-recente');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoMovimentacao>('todos');
  const [filtroCarteira, setFiltroCarteira] = useState<string>('todas');
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoMovimentacao>(TipoMovimentacao.RECEITA);
  const [frequencia, setFrequencia] = useState<FrequenciaMovimentacao>(FrequenciaMovimentacao.AVULSA);
  const [dataVencimento, setDataVencimento] = useState('');
  const [carteiraId, setCarteiraId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const repositorioMovimentacao = new RepositorioMovimentacao();
  const repositorioCarteira = new RepositorioCarteira();

  useEffect(() => {
    carregarDados();
  }, []);

  /**
   * Carrega movimentações e carteiras
   */
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [dadosMovimentacoes, dadosCarteiras] = await Promise.all([
        repositorioMovimentacao.listarTodas(),
        repositorioCarteira.listarTodas()
      ]);
      setMovimentacoes(dadosMovimentacoes);
      setCarteiras(dadosCarteiras);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as movimentações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre o diálogo para criar nova movimentação
   */
  const abrirDialogNova = () => {
    setMovimentacaoEditando(null);
    limparFormulario();
    setDialogAberto(true);
  };

  /**
   * Abre o diálogo para editar movimentação existente
   */
  const abrirDialogEdicao = (movimentacao: Movimentacao) => {
    setMovimentacaoEditando(movimentacao);
    setNome(movimentacao.nome);
    setValor(movimentacao.valor.toString());
    setTipo(movimentacao.tipo);
    setFrequencia(movimentacao.frequencia);
    setDataVencimento(format(movimentacao.dataVencimento, 'yyyy-MM-dd'));
    setCarteiraId(movimentacao.carteiraId);
    setDescricao(movimentacao.descricao || '');
    setDialogAberto(true);
  };

  /**
   * Limpa os campos do formulário
   */
  const limparFormulario = () => {
    setNome('');
    setValor('');
    setTipo(TipoMovimentacao.RECEITA);
    setFrequencia(FrequenciaMovimentacao.AVULSA);
    setDataVencimento('');
    setCarteiraId('');
    setDescricao('');
  };

  /**
   * Valida os dados do formulário
   */
  const validarFormulario = (): boolean => {
    if (!Movimentacao.validarNome(nome)) {
      toast({
        title: 'Nome inválido',
        description: 'O nome deve ter entre 2 e 100 caracteres.',
        variant: 'destructive'
      });
      return false;
    }

    const valorNum = parseFloat(valor);
    if (!Movimentacao.validarValor(valorNum)) {
      toast({
        title: 'Valor inválido',
        description: 'O valor deve ser entre R$ 0,01 e R$ 999.999,99.',
        variant: 'destructive'
      });
      return false;
    }

    // Data só é obrigatória para movimentações recorrentes
    if (frequencia !== FrequenciaMovimentacao.AVULSA && !dataVencimento) {
      toast({
        title: 'Data obrigatória',
        description: 'Para movimentações recorrentes, selecione a data de vencimento.',
        variant: 'destructive'
      });
      return false;
    }

    if (!carteiraId) {
      toast({
        title: 'Carteira obrigatória',
        description: 'Selecione uma carteira.',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  /**
   * Salva a movimentação (criar ou editar)
   */
  const salvarMovimentacao = async () => {
    if (!validarFormulario()) return;

    try {
      setSalvando(true);
      const valorNum = parseFloat(valor);
      // Para movimentações avulsas sem data, usar data atual
      const data = dataVencimento 
        ? new Date(dataVencimento + 'T00:00:00')
        : new Date();

      if (movimentacaoEditando) {
        // Editar movimentação existente
        await repositorioMovimentacao.atualizar(movimentacaoEditando.id, {
          nome: nome.trim(),
          valor: valorNum,
          tipo,
          frequencia,
          dataVencimento: data,
          descricao: descricao.trim() || undefined
        });
        
        toast({
          title: 'Movimentação atualizada',
          description: 'A movimentação foi atualizada com sucesso.'
        });
      } else {
        // Criar nova movimentação
        await repositorioMovimentacao.criar({
          nome: nome.trim(),
          valor: valorNum,
          tipo,
          frequencia,
          dataVencimento: data,
          carteiraId,
          descricao: descricao.trim() || undefined
        });

        toast({
          title: 'Movimentação criada',
          description: 'A movimentação foi criada com sucesso.'
        });
      }

      setDialogAberto(false);
      limparFormulario();
      await carregarDados();
    } catch (error) {
      toast({
        title: 'Erro ao salvar movimentação',
        description: 'Não foi possível salvar a movimentação.',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  /**
   * Exclui uma movimentação
   */
  const excluirMovimentacao = async (id: string) => {
    try {
      await repositorioMovimentacao.excluir(id);
      toast({
        title: 'Movimentação excluída',
        description: 'A movimentação foi excluída com sucesso.'
      });
      await carregarDados();
    } catch (error) {
      toast({
        title: 'Erro ao excluir movimentação',
        description: 'Não foi possível excluir a movimentação.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Aplica filtros e ordenação às movimentações
   */
  const movimentacoesFiltradas = () => {
    let resultado = [...movimentacoes];
    
    // Aplicar filtros
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(m => m.tipo === filtroTipo);
    }
    
    if (filtroCarteira !== 'todas') {
      resultado = resultado.filter(m => m.carteiraId === filtroCarteira);
    }
    
    // Aplicar ordenação
    switch (ordenacao) {
      case 'data-recente':
        return resultado.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'data-antiga':
        return resultado.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'valor-maior':
        return resultado.sort((a, b) => b.valor - a.valor);
      case 'valor-menor':
        return resultado.sort((a, b) => a.valor - b.valor);
      case 'vencimento-proximo':
        return resultado.sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime());
      case 'vencimento-distante':
        return resultado.sort((a, b) => b.dataVencimento.getTime() - a.dataVencimento.getTime());
      default:
        return resultado;
    }
  };

  /**
   * Retorna o nome da carteira pelo ID
   */
  const obterNomeCarteira = (carteiraId: string): string => {
    const carteira = carteiras.find(c => c.id === carteiraId);
    return carteira?.nome || 'Carteira não encontrada';
  };

  /**
   * Retorna o badge da frequência
   */
  const obterBadgeFrequencia = (frequencia: FrequenciaMovimentacao) => {
    const config = {
      [FrequenciaMovimentacao.AVULSA]: { label: 'Avulsa', variant: 'secondary' as const },
      [FrequenciaMovimentacao.SEMANAL]: { label: 'Semanal', variant: 'default' as const },
      [FrequenciaMovimentacao.QUINZENAL]: { label: 'Quinzenal', variant: 'default' as const },
      [FrequenciaMovimentacao.MENSAL]: { label: 'Mensal', variant: 'default' as const }
    };
    
    const { label, variant } = config[frequencia];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNova}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {movimentacaoEditando ? 'Editar Movimentação' : 'Nova Movimentação'}
              </DialogTitle>
              <DialogDescription>
                {movimentacaoEditando 
                  ? 'Edite as informações da movimentação.'
                  : 'Crie uma nova movimentação financeira.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Salário, Conta de luz..."
                  maxLength={100}
                />
              </div>
              
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(value) => setTipo(value as TipoMovimentacao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TipoMovimentacao.RECEITA}>Receita</SelectItem>
                    <SelectItem value={TipoMovimentacao.DESPESA}>Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="frequencia">Frequência</Label>
                <Select value={frequencia} onValueChange={(value) => setFrequencia(value as FrequenciaMovimentacao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FrequenciaMovimentacao.AVULSA}>Avulsa</SelectItem>
                    <SelectItem value={FrequenciaMovimentacao.SEMANAL}>Semanal</SelectItem>
                    <SelectItem value={FrequenciaMovimentacao.QUINZENAL}>Quinzenal</SelectItem>
                    <SelectItem value={FrequenciaMovimentacao.MENSAL}>Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dataVencimento">
                  Data de Vencimento
                  {frequencia !== FrequenciaMovimentacao.AVULSA && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  disabled={frequencia === FrequenciaMovimentacao.AVULSA}
                />
                {frequencia === FrequenciaMovimentacao.AVULSA && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Para movimentações avulsas, a data atual será usada automaticamente.
                  </p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="carteiraId">Carteira</Label>
                <Select 
                  value={carteiraId} 
                  onValueChange={setCarteiraId}
                  disabled={!!movimentacaoEditando}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {carteiras.map((carteira) => (
                      <SelectItem key={carteira.id} value={carteira.id}>
                        {carteira.nome} - {carteira.formatarSaldo()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes sobre a movimentação..."
                  maxLength={500}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarMovimentacao}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controles de filtro e ordenação */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filtroTipo">Tipo:</Label>
          <Select
            value={filtroTipo}
            onValueChange={(value) => setFiltroTipo(value as typeof filtroTipo)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value={TipoMovimentacao.RECEITA}>Receitas</SelectItem>
              <SelectItem value={TipoMovimentacao.DESPESA}>Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="filtroCarteira">Carteira:</Label>
          <Select
            value={filtroCarteira}
            onValueChange={setFiltroCarteira}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {carteiras.map((carteira) => (
                <SelectItem key={carteira.id} value={carteira.id}>
                  {carteira.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="ordenacao">Ordenar por:</Label>
          <Select
            value={ordenacao}
            onValueChange={(value) => setOrdenacao(value as TipoOrdenacao)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data-recente">Data (Mais recente)</SelectItem>
              <SelectItem value="data-antiga">Data (Mais antiga)</SelectItem>
              <SelectItem value="valor-maior">Valor (Maior)</SelectItem>
              <SelectItem value="valor-menor">Valor (Menor)</SelectItem>
              <SelectItem value="vencimento-proximo">Vencimento (Próximo)</SelectItem>
              <SelectItem value="vencimento-distante">Vencimento (Distante)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de movimentações */}
      {movimentacoesFiltradas().length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando sua primeira movimentação financeira.
            </p>
            <Button onClick={abrirDialogNova}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira movimentação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {movimentacoesFiltradas().map((movimentacao) => (
            <Card key={movimentacao.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {movimentacao.tipo === TipoMovimentacao.RECEITA ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                    <CardTitle className="text-lg">{movimentacao.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirDialogEdicao(movimentacao)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A movimentação "{movimentacao.nome}" 
                            será excluída permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => excluirMovimentacao(movimentacao.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {movimentacao.descricao && (
                  <CardDescription>{movimentacao.descricao}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <span className={`text-xl font-bold ${movimentacao.obterCorTipo()}`}>
                      {movimentacao.tipo === TipoMovimentacao.RECEITA ? '+' : '-'}
                      {movimentacao.formatarValor()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Frequência</span>
                    <div className="flex items-center gap-2">
                      {movimentacao.frequencia !== FrequenciaMovimentacao.AVULSA && (
                        <Repeat className="h-3 w-3 text-muted-foreground" />
                      )}
                      {obterBadgeFrequencia(movimentacao.frequencia)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {format(movimentacao.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {movimentacao.estaVencida() && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Carteira</span>
                    <span className="text-sm font-medium">
                      {obterNomeCarteira(movimentacao.carteiraId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={movimentacao.ativa ? 'default' : 'secondary'}>
                      {movimentacao.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}