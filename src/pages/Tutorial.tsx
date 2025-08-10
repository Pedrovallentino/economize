import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Home, Wallet, TrendingUp, Target, PiggyBank, User, Plus } from 'lucide-react';

export default function Tutorial() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tutorial do Sistema</h1>
        <p className="text-muted-foreground">
          Guia completo para usar todas as funcionalidades do Economize
        </p>
      </div>

      <Separator />

      {/* Objetivo do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Objetivo do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            O <strong>Economize</strong> é um sistema de controle financeiro pessoal que permite 
            organizar suas finanças de forma simples e eficiente. Com ele, você pode:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Controlar múltiplas carteiras e contas</li>
            <li>Registrar todas suas movimentações financeiras</li>
            <li>Criar reservas específicas em caixinhas de poupança</li>
            <li>Definir e acompanhar metas financeiras</li>
            <li>Visualizar sua situação financeira de forma clara</li>
          </ul>
        </CardContent>
      </Card>

      {/* Principais Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Funcionalidades</CardTitle>
          <CardDescription>
            Conheça cada módulo do sistema e como utilizá-los
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carteiras */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Wallet className="h-4 w-4" />
              Carteiras
            </h3>
            <p className="text-sm text-muted-foreground">
              Organize suas finanças em diferentes contas. Cada carteira representa uma conta bancária, 
              carteira física ou meio de pagamento. Você pode criar quantas carteiras precisar e 
              acompanhar o saldo de cada uma separadamente.
            </p>
          </div>

          <Separator />

          {/* Movimentações */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" />
              Movimentações
            </h3>
            <p className="text-sm text-muted-foreground">
              Registre todas suas receitas e despesas. Cada movimentação pode ser categorizada e 
              vinculada a uma carteira específica. Isso permite ter um histórico completo de suas 
              finanças e entender para onde vai seu dinheiro.
            </p>
          </div>

          <Separator />

          {/* Caixinhas de Poupança */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <PiggyBank className="h-4 w-4" />
              Caixinhas de Poupança
            </h3>
            <p className="text-sm text-muted-foreground">
              Crie reservas específicas para diferentes objetivos. As caixinhas funcionam como 
              compartimentos separados onde você pode guardar dinheiro para viagens, emergências, 
              compras específicas ou qualquer outro objetivo.
            </p>
          </div>

          <Separator />

          {/* Metas Financeiras */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Target className="h-4 w-4" />
              Metas Financeiras
            </h3>
            <p className="text-sm text-muted-foreground">
              Defina objetivos financeiros com valor e prazo. Acompanhe seu progresso e veja 
              quanto falta para atingir cada meta. O sistema mostra automaticamente quando 
              uma meta foi concluída.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo Básico de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo Básico de Uso</CardTitle>
          <CardDescription>
            Passos simples para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Crie suas carteiras</h4>
                <p className="text-sm text-muted-foreground">
                  Comece criando carteiras para suas contas bancárias, carteira física, etc.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Registre suas movimentações</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione suas receitas e despesas para acompanhar o fluxo de dinheiro.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Configure caixinhas e metas</h4>
                <p className="text-sm text-muted-foreground">
                  Organize suas reservas em caixinhas e defina metas para seus objetivos.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Acompanhe seu progresso</h4>
                <p className="text-sm text-muted-foreground">
                  Use o dashboard para visualizar sua situação financeira geral.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Uso</CardTitle>
          <CardDescription>
            Sugestões para aproveitar melhor o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">💡 Organize suas categorias</h4>
              <p className="text-sm text-muted-foreground">
                Use nomes claros e consistentes para suas carteiras e movimentações. 
                Isso facilita a análise posterior dos dados.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">📊 Registre regularmente</h4>
              <p className="text-sm text-muted-foreground">
                Mantenha o hábito de registrar suas movimentações diariamente ou semanalmente. 
                Dados atualizados geram relatórios mais precisos.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">🎯 Use metas realistas</h4>
              <p className="text-sm text-muted-foreground">
                Defina metas alcançáveis com prazos viáveis. Isso mantém a motivação e 
                torna o controle financeiro mais efetivo.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">🏦 Separe por contexto</h4>
              <p className="text-sm text-muted-foreground">
                Use caixinhas para diferentes objetivos (emergência, viagem, compras) e 
                carteiras para diferentes meios de pagamento (banco, dinheiro, cartão).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}