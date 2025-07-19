import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RepositorioCarteira } from '@/repositorios/repositorioCarteira';
import { Carteira } from '@/dominio/Carteira';
import { Wallet, Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TipoOrdenacao = 'data-recente' | 'data-antiga' | 'nome-az' | 'nome-za' | 'saldo-maior' | 'saldo-menor';

/**
 * Página de gerenciamento de carteiras
 * Permite criar, editar, excluir e listar carteiras
 */
export default function Carteiras() {
  const { toast } = useToast();
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [carteiraEditando, setCarteiraEditando] = useState<Carteira | null>(null);
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao>('data-recente');
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const repositorioCarteira = new RepositorioCarteira();

  useEffect(() => {
    carregarCarteiras();
  }, []);

  /**
   * Carrega todas as carteiras do usuário
   */
  const carregarCarteiras = async () => {
    try {
      setLoading(true);
      const dados = await repositorioCarteira.listarTodas();
      setCarteiras(dados);
    } catch (error) {
      toast({
        title: 'Erro ao carregar carteiras',
        description: 'Não foi possível carregar suas carteiras.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre o diálogo para criar nova carteira
   */
  const abrirDialogNova = () => {
    setCarteiraEditando(null);
    limparFormulario();
    setDialogAberto(true);
  };

  /**
   * Abre o diálogo para editar carteira existente
   */
  const abrirDialogEdicao = (carteira: Carteira) => {
    setCarteiraEditando(carteira);
    setNome(carteira.nome);
    setSaldo(carteira.saldo.toString());
    setDescricao(carteira.descricao || '');
    setDialogAberto(true);
  };

  /**
   * Limpa os campos do formulário
   */
  const limparFormulario = () => {
    setNome('');
    setSaldo('');
    setDescricao('');
  };

  /**
   * Valida os dados do formulário
   */
  const validarFormulario = (): boolean => {
    if (!Carteira.validarNome(nome)) {
      toast({
        title: 'Nome inválido',
        description: 'O nome deve ter entre 2 e 50 caracteres.',
        variant: 'destructive'
      });
      return false;
    }

    const valorSaldo = parseFloat(saldo);
    if (isNaN(valorSaldo) || valorSaldo < 0) {
      toast({
        title: 'Saldo inválido',
        description: 'O saldo deve ser um número positivo.',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  /**
   * Salva a carteira (criar ou editar)
   */
  const salvarCarteira = async () => {
    if (!validarFormulario()) return;

    try {
      setSalvando(true);
      const valorSaldo = parseFloat(saldo);

      if (carteiraEditando) {
        // Editar carteira existente
        await repositorioCarteira.atualizar(carteiraEditando.id, {
          nome: nome.trim(),
          saldo: valorSaldo,
          descricao: descricao.trim() || undefined
        });
        
        toast({
          title: 'Carteira atualizada',
          description: 'A carteira foi atualizada com sucesso.'
        });
      } else {
        // Criar nova carteira
        await repositorioCarteira.criar({
          nome: nome.trim(),
          saldo: valorSaldo,
          descricao: descricao.trim() || undefined
        });

        toast({
          title: 'Carteira criada',
          description: 'A carteira foi criada com sucesso.'
        });
      }

      setDialogAberto(false);
      limparFormulario();
      await carregarCarteiras();
    } catch (error) {
      toast({
        title: 'Erro ao salvar carteira',
        description: 'Não foi possível salvar a carteira.',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  /**
   * Exclui uma carteira
   */
  const excluirCarteira = async (id: string) => {
    try {
      await repositorioCarteira.excluir(id);
      toast({
        title: 'Carteira excluída',
        description: 'A carteira foi excluída com sucesso.'
      });
      await carregarCarteiras();
    } catch (error) {
      toast({
        title: 'Erro ao excluir carteira',
        description: 'Não foi possível excluir a carteira.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Ordena as carteiras conforme o critério selecionado
   */
  const carteirasOrdenadas = () => {
    const copia = [...carteiras];
    
    switch (ordenacao) {
      case 'data-recente':
        return copia.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'data-antiga':
        return copia.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'nome-az':
        return copia.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'nome-za':
        return copia.sort((a, b) => b.nome.localeCompare(a.nome));
      case 'saldo-maior':
        return copia.sort((a, b) => b.saldo - a.saldo);
      case 'saldo-menor':
        return copia.sort((a, b) => a.saldo - b.saldo);
      default:
        return copia;
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Carteiras</h1>
          <p className="text-muted-foreground">
            Gerencie suas carteiras financeiras
          </p>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNova}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Carteira
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {carteiraEditando ? 'Editar Carteira' : 'Nova Carteira'}
              </DialogTitle>
              <DialogDescription>
                {carteiraEditando 
                  ? 'Edite as informações da carteira.'
                  : 'Crie uma nova carteira para organizar suas finanças.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Conta Corrente"
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label htmlFor="saldo">Saldo Inicial</Label>
                <Input
                  id="saldo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição da carteira..."
                  maxLength={200}
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
                onClick={salvarCarteira}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controles de ordenação */}
      <div className="flex items-center gap-4">
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
            <SelectItem value="nome-az">Nome (A-Z)</SelectItem>
            <SelectItem value="nome-za">Nome (Z-A)</SelectItem>
            <SelectItem value="saldo-maior">Saldo (Maior)</SelectItem>
            <SelectItem value="saldo-menor">Saldo (Menor)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de carteiras */}
      {carteiras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma carteira encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando sua primeira carteira para organizar suas finanças.
            </p>
            <Button onClick={abrirDialogNova}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira carteira
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {carteirasOrdenadas().map((carteira) => (
            <Card key={carteira.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{carteira.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirDialogEdicao(carteira)}
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
                          <AlertDialogTitle>Excluir carteira?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A carteira "{carteira.nome}" 
                            será excluída permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => excluirCarteira(carteira.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {carteira.descricao && (
                  <CardDescription>{carteira.descricao}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Saldo</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {carteira.formatarSaldo()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Criada em {format(carteira.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
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