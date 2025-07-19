import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RepositorioCarteira } from '@/repositorios/repositorioCarteira';
import { RepositorioMeta } from '@/repositorios/repositorioMeta';
import { RepositorioMovimentacao } from '@/repositorios/repositorioMovimentacao';
import { RepositorioCaixinha } from '@/repositorios/repositorioCaixinha';
import { Carteira } from '@/dominio/Carteira';
import { MetaFinanceira } from '@/dominio/MetaFinanceira';
import { Movimentacao } from '@/dominio/Movimentacao';
import { CaixinhaPoupanca } from '@/dominio/CaixinhaPoupanca';
import { Wallet, Target, TrendingUp, PiggyBank, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/**
 * Página principal do dashboard
 * @returns JSX da página de dashboard
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [metas, setMetas] = useState<MetaFinanceira[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [caixinhas, setCaixinhas] = useState<CaixinhaPoupanca[]>([]);
  const [loading, setLoading] = useState(true);

  const repositorioCarteira = new RepositorioCarteira();
  const repositorioMeta = new RepositorioMeta();
  const repositorioMovimentacao = new RepositorioMovimentacao();
  const repositorioCaixinha = new RepositorioCaixinha();

  useEffect(() => {
    carregarDados();
  }, []);

  /**
   * Carrega todos os dados do dashboard
   */
  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [
        carteirasData,
        metasData,
        movimentacoesData,
        caixinhasData
      ] = await Promise.all([
        repositorioCarteira.listarTodas(),
        repositorioMeta.listarEmAndamento(),
        repositorioMovimentacao.listarVencidas(),
        repositorioCaixinha.listarTodas()
      ]);

      setCarteiras(carteirasData);
      setMetas(metasData);
      setMovimentacoes(movimentacoesData);
      setCaixinhas(caixinhasData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcula o saldo total de todas as carteiras
   */
  const calcularSaldoTotal = (): number => {
    return carteiras.reduce((total, carteira) => total + carteira.saldo, 0);
  };

  /**
   * Calcula o total das caixinhas
   */
  const calcularTotalCaixinhas = (): number => {
    return caixinhas.reduce((total, caixinha) => total + caixinha.saldo, 0);
  };

  /**
   * Formata valor monetário
   */
  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(calcularSaldoTotal())}
            </div>
            <p className="text-xs text-muted-foreground">
              {carteiras.length} carteira(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metas Ativas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metas.length}</div>
            <p className="text-xs text-muted-foreground">
              {metas.filter(m => m.estaAtrasada()).length} atrasada(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Movimentações Vencidas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movimentacoes.length}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Poupado
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(calcularTotalCaixinhas())}
            </div>
            <p className="text-xs text-muted-foreground">
              {caixinhas.length} caixinha(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seções de ações rápidas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Carteiras recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Carteiras Recentes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/carteiras')}
              >
                Ver todas
              </Button>
            </div>
            <CardDescription>
              Suas carteiras mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {carteiras.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhuma carteira encontrada</p>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/carteiras')}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira carteira
                </Button>
              </div>
            ) : (
              carteiras.slice(0, 3).map((carteira) => (
                <div
                  key={carteira.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{carteira.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {carteira.formatarSaldo()}
                    </p>
                  </div>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Metas em andamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Metas em Andamento</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/metas')}
              >
                Ver todas
              </Button>
            </div>
            <CardDescription>
              Progresso das suas metas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhuma meta encontrada</p>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/metas')}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira meta
                </Button>
              </div>
            ) : (
              metas.slice(0, 3).map((meta) => (
                <div
                  key={meta.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{meta.nome}</p>
                    <span className="text-sm text-muted-foreground">
                      {meta.calcularProgresso().toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${meta.obterCorProgresso()}`}
                      style={{ width: `${Math.min(meta.calcularProgresso(), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {MetaFinanceira.formatarValor(meta.valorAcumulado)} de{' '}
                    {MetaFinanceira.formatarValor(meta.valorObjetivo)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}