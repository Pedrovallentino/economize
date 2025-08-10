import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Target, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RepositorioMeta, DadosCriacaoMeta, DadosAtualizacaoMeta } from '@/repositorios/repositorioMeta';
import { MetaFinanceira } from '@/dominio/MetaFinanceira';
import { useToast } from '@/hooks/use-toast';

const repositorioMeta = new RepositorioMeta();

const schemaCriacaoMeta = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  valorObjetivo: z.number().min(0.01, 'Valor objetivo deve ser positivo'),
  dataLimite: z.string().min(1, 'Data limite é obrigatória'),
  descricao: z.string().optional(),
});

const schemaAtualizacaoMeta = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  valorObjetivo: z.number().min(0.01, 'Valor objetivo deve ser positivo'),
  dataLimite: z.string().min(1, 'Data limite é obrigatória'),
  descricao: z.string().optional(),
});

const schemaMovimentacao = z.object({
  valor: z.number().min(0.01, 'Valor deve ser positivo'),
});

type DadosCriacaoMetaForm = z.infer<typeof schemaCriacaoMeta>;
type DadosAtualizacaoMetaForm = z.infer<typeof schemaAtualizacaoMeta>;
type DadosMovimentacaoForm = z.infer<typeof schemaMovimentacao>;

const Metas = () => {
  const [metas, setMetas] = useState<MetaFinanceira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogCriarAberto, setDialogCriarAberto] = useState(false);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [dialogMovimentacaoAberto, setDialogMovimentacaoAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<MetaFinanceira | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'deposito' | 'saque'>('deposito');
  const { toast } = useToast();

  const formCriar = useForm<DadosCriacaoMetaForm>({
    resolver: zodResolver(schemaCriacaoMeta),
    defaultValues: {
      nome: '',
      valorObjetivo: 0,
      dataLimite: '',
      descricao: '',
    },
  });

  const formEditar = useForm<DadosAtualizacaoMetaForm>({
    resolver: zodResolver(schemaAtualizacaoMeta),
    defaultValues: {
      nome: '',
      valorObjetivo: 0,
      dataLimite: '',
      descricao: '',
    },
  });

  const formMovimentacao = useForm<DadosMovimentacaoForm>({
    resolver: zodResolver(schemaMovimentacao),
    defaultValues: {
      valor: 0,
    },
  });

  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      setCarregando(true);
      const metasCarregadas = await repositorioMeta.listarTodas();
      setMetas(metasCarregadas);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar metas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  const criarMeta = async (dados: DadosCriacaoMetaForm) => {
    try {
      const dadosCriacao: DadosCriacaoMeta = {
        nome: dados.nome,
        valorObjetivo: dados.valorObjetivo,
        dataLimite: new Date(dados.dataLimite),
        valorAcumulado: 0,
        descricao: dados.descricao || undefined,
      };

      await repositorioMeta.criar(dadosCriacao);
      
      toast({
        title: 'Sucesso',
        description: 'Meta criada com sucesso!',
      });

      formCriar.reset();
      setDialogCriarAberto(false);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar meta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const atualizarMeta = async (dados: DadosAtualizacaoMetaForm) => {
    if (!metaSelecionada) return;

    try {
      const dadosAtualizacao: DadosAtualizacaoMeta = {
        nome: dados.nome,
        valorObjetivo: dados.valorObjetivo,
        dataLimite: new Date(dados.dataLimite),
        descricao: dados.descricao || undefined,
      };

      await repositorioMeta.atualizar(metaSelecionada.id, dadosAtualizacao);
      
      toast({
        title: 'Sucesso',
        description: 'Meta atualizada com sucesso!',
      });

      setDialogEditarAberto(false);
      setMetaSelecionada(null);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar meta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const excluirMeta = async () => {
    if (!metaSelecionada) return;

    try {
      await repositorioMeta.excluir(metaSelecionada.id);
      
      toast({
        title: 'Sucesso',
        description: 'Meta excluída com sucesso!',
      });

      setDialogExcluirAberto(false);
      setMetaSelecionada(null);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir meta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const movimentarMeta = async (dados: DadosMovimentacaoForm) => {
    if (!metaSelecionada) return;

    try {
      if (tipoMovimentacao === 'deposito') {
        await repositorioMeta.depositar(metaSelecionada.id, dados.valor);
        toast({
          title: 'Sucesso',
          description: 'Depósito realizado com sucesso!',
        });
      } else {
        // Verificar se há saldo suficiente
        if (dados.valor > metaSelecionada.valorAcumulado) {
          toast({
            title: 'Erro',
            description: 'Saldo insuficiente para realizar o saque.',
            variant: 'destructive',
          });
          return;
        }
        await repositorioMeta.sacar(metaSelecionada.id, dados.valor);
        toast({
          title: 'Sucesso',
          description: 'Saque realizado com sucesso!',
        });
      }

      formMovimentacao.reset();
      setDialogMovimentacaoAberto(false);
      setMetaSelecionada(null);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao movimentar meta:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao realizar operação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogEditar = (meta: MetaFinanceira) => {
    setMetaSelecionada(meta);
    formEditar.reset({
      nome: meta.nome,
      valorObjetivo: meta.valorObjetivo,
      dataLimite: format(meta.dataLimite, 'yyyy-MM-dd'),
      descricao: meta.descricao || '',
    });
    setDialogEditarAberto(true);
  };

  const abrirDialogMovimentacao = (meta: MetaFinanceira, tipo: 'deposito' | 'saque') => {
    setMetaSelecionada(meta);
    setTipoMovimentacao(tipo);
    formMovimentacao.reset();
    setDialogMovimentacaoAberto(true);
  };

  const abrirDialogExcluir = (meta: MetaFinanceira) => {
    setMetaSelecionada(meta);
    setDialogExcluirAberto(true);
  };

  const metasEmAndamento = metas.filter(meta => !meta.concluida);
  const metasConcluidas = metas.filter(meta => meta.concluida);

  const MetaCard = ({ meta }: { meta: MetaFinanceira }) => {
    const progresso = meta.calcularProgresso();
    const diasRestantes = meta.diasRestantes();
    const valorRestante = meta.valorRestante();
    const estaAtrasada = meta.estaAtrasada();

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">{meta.nome}</CardTitle>
              {meta.descricao && (
                <p className="text-sm text-muted-foreground">{meta.descricao}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirDialogEditar(meta)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirDialogExcluir(meta)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-medium">{progresso.toFixed(1)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Acumulado</p>
              <p className="font-semibold text-lg">{MetaFinanceira.formatarValor(meta.valorAcumulado)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Objetivo</p>
              <p className="font-semibold text-lg">{MetaFinanceira.formatarValor(meta.valorObjetivo)}</p>
            </div>
          </div>

          {!meta.concluida && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Restante</p>
                <p className="font-medium">{MetaFinanceira.formatarValor(valorRestante)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prazo</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className={estaAtrasada ? "text-destructive font-medium" : ""}>
                    {diasRestantes > 0 ? `${diasRestantes} dias` : `${Math.abs(diasRestantes)} dias atraso`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant={meta.concluida ? "default" : estaAtrasada ? "destructive" : "secondary"}>
                <Target className="h-3 w-3 mr-1" />
                {meta.concluida ? 'Concluída' : estaAtrasada ? 'Atrasada' : 'Em andamento'}
              </Badge>
            </div>
            
            {!meta.concluida && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDialogMovimentacao(meta, 'deposito')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Depositar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDialogMovimentacao(meta, 'saque')}
                  disabled={meta.valorAcumulado <= 0}
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Sacar
                </Button>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Criada em {format(meta.createdAt, 'dd/MM/yyyy', { locale: ptBR })} • 
            Prazo: {format(meta.dataLimite, 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando metas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-muted-foreground mt-1">
            Defina e acompanhe seus objetivos financeiros
          </p>
        </div>
        
        <Dialog open={dialogCriarAberto} onOpenChange={setDialogCriarAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <Form {...formCriar}>
              <form onSubmit={formCriar.handleSubmit(criarMeta)} className="space-y-4">
                <FormField
                  control={formCriar.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Meta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Viagem para Europa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formCriar.control}
                  name="valorObjetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Objetivo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formCriar.control}
                  name="dataLimite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limite</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formCriar.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva sua meta..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Criar Meta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogCriarAberto(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="em-andamento" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="em-andamento">
            Em Andamento ({metasEmAndamento.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({metasConcluidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="em-andamento" className="mt-6">
          {metasEmAndamento.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma meta em andamento</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira meta financeira para começar a acompanhar seus objetivos.
              </p>
              <Button onClick={() => setDialogCriarAberto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metasEmAndamento.map((meta) => (
                <MetaCard key={meta.id} meta={meta} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-6">
          {metasConcluidas.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma meta concluída</h3>
              <p className="text-muted-foreground">
                Suas metas concluídas aparecerão aqui quando atingirem o objetivo.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metasConcluidas.map((meta) => (
                <MetaCard key={meta.id} meta={meta} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={dialogEditarAberto} onOpenChange={setDialogEditarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <Form {...formEditar}>
            <form onSubmit={formEditar.handleSubmit(atualizarMeta)} className="space-y-4">
              <FormField
                control={formEditar.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formEditar.control}
                name="valorObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Objetivo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEditar.control}
                name="dataLimite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEditar.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogEditarAberto(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Movimentação */}
      <Dialog open={dialogMovimentacaoAberto} onOpenChange={setDialogMovimentacaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoMovimentacao === 'deposito' ? 'Depositar na Meta' : 'Sacar da Meta'}
            </DialogTitle>
          </DialogHeader>
          <Form {...formMovimentacao}>
            <form onSubmit={formMovimentacao.handleSubmit(movimentarMeta)} className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold">{metaSelecionada?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Saldo atual: {metaSelecionada ? MetaFinanceira.formatarValor(metaSelecionada.valorAcumulado) : 'R$ 0,00'}
                </p>
              </div>

              <FormField
                control={formMovimentacao.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {tipoMovimentacao === 'deposito' ? 'Depositar' : 'Sacar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogMovimentacaoAberto(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{metaSelecionada?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirMeta}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;