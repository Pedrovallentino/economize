import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Calendar, History, ArrowUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CaixinhaPoupanca, HistoricoCaixinha, TipoMovimentacaoCaixinha } from "@/dominio/CaixinhaPoupanca";
import { RepositorioCaixinha } from "@/repositorios/repositorioCaixinha";

const repositorio = new RepositorioCaixinha();

const schemaCaixinha = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  saldo: z.string().optional(),
  descricao: z.string().optional(),
});

const schemaMovimentacao = z.object({
  valor: z.string().min(1, "Valor é obrigatório"),
  descricao: z.string().optional(),
});

type FormDataCaixinha = z.infer<typeof schemaCaixinha>;
type FormDataMovimentacao = z.infer<typeof schemaMovimentacao>;

type TipoOrdenacao = "saldo_desc" | "saldo_asc" | "data_desc" | "data_asc";

export default function Caixinhas() {
  const [caixinhas, setCaixinhas] = useState<CaixinhaPoupanca[]>([]);
  const [historico, setHistorico] = useState<{ [key: string]: HistoricoCaixinha[] }>({});
  const [caixinhaEditando, setCaixinhaEditando] = useState<CaixinhaPoupanca | null>(null);
  const [caixinhaExcluindo, setCaixinhaExcluindo] = useState<CaixinhaPoupanca | null>(null);
  const [caixinhaMovimentacao, setCaixinhaMovimentacao] = useState<{ caixinha: CaixinhaPoupanca; tipo: TipoMovimentacaoCaixinha } | null>(null);
  const [caixinhaHistorico, setCaixinhaHistorico] = useState<CaixinhaPoupanca | null>(null);
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao>("data_desc");
  const [dialogNovaCaixinha, setDialogNovaCaixinha] = useState(false);
  const [dialogEdicao, setDialogEdicao] = useState(false);
  const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);
  const { toast } = useToast();

  const formNovaCaixinha = useForm<FormDataCaixinha>({
    resolver: zodResolver(schemaCaixinha),
    defaultValues: { nome: "", saldo: "", descricao: "" },
  });

  const formEdicao = useForm<FormDataCaixinha>({
    resolver: zodResolver(schemaCaixinha),
    defaultValues: { nome: "", saldo: "", descricao: "" },
  });

  const formMovimentacao = useForm<FormDataMovimentacao>({
    resolver: zodResolver(schemaMovimentacao),
    defaultValues: { valor: "", descricao: "" },
  });

  useEffect(() => {
    carregarCaixinhas();
  }, []);

  const carregarCaixinhas = async () => {
    try {
      const lista = await repositorio.listarTodas();
      setCaixinhas(lista);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as caixinhas",
        variant: "destructive",
      });
    }
  };

  const carregarHistorico = async (caixinhaId: string) => {
    try {
      const hist = await repositorio.buscarHistorico(caixinhaId);
      setHistorico(prev => ({ ...prev, [caixinhaId]: hist }));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
    }
  };

  const criarCaixinha = async (dados: FormDataCaixinha) => {
    try {
      await repositorio.criar({
        nome: dados.nome,
        saldo: dados.saldo ? parseFloat(dados.saldo) : 0,
        descricao: dados.descricao,
      });
      toast({
        title: "Sucesso",
        description: "Caixinha criada com sucesso",
      });
      setDialogNovaCaixinha(false);
      formNovaCaixinha.reset();
      carregarCaixinhas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a caixinha",
        variant: "destructive",
      });
    }
  };

  const editarCaixinha = async (dados: FormDataCaixinha) => {
    if (!caixinhaEditando) return;

    try {
      await repositorio.atualizar(caixinhaEditando.id, {
        nome: dados.nome,
        saldo: dados.saldo ? parseFloat(dados.saldo) : caixinhaEditando.saldo,
        descricao: dados.descricao,
      });
      toast({
        title: "Sucesso",
        description: "Caixinha atualizada com sucesso",
      });
      setDialogEdicao(false);
      setCaixinhaEditando(null);
      formEdicao.reset();
      carregarCaixinhas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a caixinha",
        variant: "destructive",
      });
    }
  };

  const excluirCaixinha = async () => {
    if (!caixinhaExcluindo) return;

    try {
      await repositorio.excluir(caixinhaExcluindo.id);
      toast({
        title: "Sucesso",
        description: "Caixinha excluída com sucesso",
      });
      setCaixinhaExcluindo(null);
      carregarCaixinhas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a caixinha",
        variant: "destructive",
      });
    }
  };

  const realizarMovimentacao = async (dados: FormDataMovimentacao) => {
    if (!caixinhaMovimentacao) return;

    try {
      const valor = parseFloat(dados.valor);
      if (caixinhaMovimentacao.tipo === TipoMovimentacaoCaixinha.DEPOSITO) {
        await repositorio.depositar(caixinhaMovimentacao.caixinha.id, valor, dados.descricao);
      } else {
        await repositorio.sacar(caixinhaMovimentacao.caixinha.id, valor, dados.descricao);
      }
      
      toast({
        title: "Sucesso",
        description: `${caixinhaMovimentacao.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? 'Depósito' : 'Saque'} realizado com sucesso`,
      });
      
      setDialogMovimentacao(false);
      setCaixinhaMovimentacao(null);
      formMovimentacao.reset();
      carregarCaixinhas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar a movimentação",
        variant: "destructive",
      });
    }
  };

  const abrirEdicao = (caixinha: CaixinhaPoupanca) => {
    setCaixinhaEditando(caixinha);
    formEdicao.reset({
      nome: caixinha.nome,
      saldo: caixinha.saldo.toString(),
      descricao: caixinha.descricao || "",
    });
    setDialogEdicao(true);
  };

  const abrirMovimentacao = (caixinha: CaixinhaPoupanca, tipo: TipoMovimentacaoCaixinha) => {
    setCaixinhaMovimentacao({ caixinha, tipo });
    formMovimentacao.reset();
    setDialogMovimentacao(true);
  };

  const abrirHistorico = async (caixinha: CaixinhaPoupanca) => {
    setCaixinhaHistorico(caixinha);
    if (!historico[caixinha.id]) {
      await carregarHistorico(caixinha.id);
    }
    setDialogHistorico(true);
  };

  const ordenarCaixinhas = (caixinhas: CaixinhaPoupanca[]): CaixinhaPoupanca[] => {
    return [...caixinhas].sort((a, b) => {
      switch (ordenacao) {
        case "saldo_desc":
          return b.saldo - a.saldo;
        case "saldo_asc":
          return a.saldo - b.saldo;
        case "data_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "data_asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  const caixinhasOrdenadas = ordenarCaixinhas(caixinhas);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixinhas de Poupança</h1>
          <p className="text-muted-foreground">Organize suas reservas financeiras</p>
        </div>
        <Dialog open={dialogNovaCaixinha} onOpenChange={setDialogNovaCaixinha}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Caixinha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Caixinha</DialogTitle>
              <DialogDescription>
                Crie uma nova caixinha para organizar suas reservas
              </DialogDescription>
            </DialogHeader>
            <Form {...formNovaCaixinha}>
              <form onSubmit={formNovaCaixinha.handleSubmit(criarCaixinha)} className="space-y-4">
                <FormField
                  control={formNovaCaixinha.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Viagem, Emergência..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovaCaixinha.control}
                  name="saldo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Inicial (opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNovaCaixinha.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição da caixinha..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogNovaCaixinha(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-sm font-medium">Ordenar por:</span>
        </div>
        <Select value={ordenacao} onValueChange={(value: TipoOrdenacao) => setOrdenacao(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saldo_desc">Maior Saldo</SelectItem>
            <SelectItem value="saldo_asc">Menor Saldo</SelectItem>
            <SelectItem value="data_desc">Mais Recente</SelectItem>
            <SelectItem value="data_asc">Mais Antiga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {caixinhasOrdenadas.map((caixinha) => (
          <Card key={caixinha.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{caixinha.nome}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirEdicao(caixinha)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCaixinhaExcluindo(caixinha)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {caixinha.descricao && (
                <CardDescription>{caixinha.descricao}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {caixinha.formatarSaldo()}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Criada em {new Date(caixinha.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => abrirMovimentacao(caixinha, TipoMovimentacaoCaixinha.DEPOSITO)}
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Depositar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => abrirMovimentacao(caixinha, TipoMovimentacaoCaixinha.SAQUE)}
                >
                  <TrendingDown className="mr-1 h-3 w-3" />
                  Sacar
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => abrirHistorico(caixinha)}
              >
                <History className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {caixinhas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma caixinha criada ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em "Nova Caixinha" para começar.
          </p>
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={dialogEdicao} onOpenChange={setDialogEdicao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Caixinha</DialogTitle>
            <DialogDescription>
              Altere as informações da caixinha
            </DialogDescription>
          </DialogHeader>
          <Form {...formEdicao}>
            <form onSubmit={formEdicao.handleSubmit(editarCaixinha)} className="space-y-4">
              <FormField
                control={formEdicao.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da caixinha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdicao.control}
                name="saldo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Atual</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdicao.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da caixinha..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setDialogEdicao(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Movimentação */}
      <Dialog open={dialogMovimentacao} onOpenChange={setDialogMovimentacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {caixinhaMovimentacao?.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? 'Depositar' : 'Sacar'}
            </DialogTitle>
            <DialogDescription>
              {caixinhaMovimentacao?.tipo === TipoMovimentacaoCaixinha.DEPOSITO 
                ? 'Adicione dinheiro à caixinha' 
                : 'Retire dinheiro da caixinha'}
            </DialogDescription>
          </DialogHeader>
          <Form {...formMovimentacao}>
            <form onSubmit={formMovimentacao.handleSubmit(realizarMovimentacao)} className="space-y-4">
              <FormField
                control={formMovimentacao.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formMovimentacao.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo da movimentação..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {caixinhaMovimentacao?.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? 'Depositar' : 'Sacar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogMovimentacao(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico - {caixinhaHistorico?.nome}</DialogTitle>
            <DialogDescription>
              Movimentações realizadas nesta caixinha
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {caixinhaHistorico && historico[caixinhaHistorico.id]?.length > 0 ? (
                historico[caixinhaHistorico.id].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {item.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {item.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? 'Depósito' : 'Saque'}
                        </p>
                        {item.descricao && (
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()} às{' '}
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        item.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.tipo === TipoMovimentacaoCaixinha.DEPOSITO ? '+' : '-'}
                        R$ {item.valor.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: R$ {item.saldoNovo.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma movimentação registrada ainda.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!caixinhaExcluindo} onOpenChange={() => setCaixinhaExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Caixinha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a caixinha "{caixinhaExcluindo?.nome}"?
              Esta ação não pode ser desfeita e todo o histórico será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirCaixinha}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}