-- Criação das tabelas do sistema financeiro

-- Tabela de perfis de usuário
CREATE TABLE public.perfis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de carteiras
CREATE TABLE public.carteiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enum para tipos de movimentação
CREATE TYPE tipo_movimentacao AS ENUM ('receita', 'despesa');

-- Enum para frequência de movimentação
CREATE TYPE frequencia_movimentacao AS ENUM ('avulsa', 'semanal', 'quinzenal', 'mensal');

-- Tabela de movimentações
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carteira_id UUID NOT NULL REFERENCES public.carteiras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  tipo tipo_movimentacao NOT NULL,
  frequencia frequencia_movimentacao NOT NULL DEFAULT 'avulsa',
  data_vencimento DATE NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de metas financeiras
CREATE TABLE public.metas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_objetivo DECIMAL(15,2) NOT NULL,
  valor_acumulado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  data_limite DATE NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de caixinhas de poupança
CREATE TABLE public.caixinhas_poupanca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de movimentações das caixinhas
CREATE TABLE public.historico_caixinhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caixinha_id UUID NOT NULL REFERENCES public.caixinhas_poupanca(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'saque')),
  valor DECIMAL(15,2) NOT NULL,
  saldo_anterior DECIMAL(15,2) NOT NULL,
  saldo_novo DECIMAL(15,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixinhas_poupanca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_caixinhas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfis
CREATE POLICY "Usuários podem visualizar seus próprios perfis" 
ON public.perfis FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir seus próprios perfis" 
ON public.perfis FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.perfis FOR UPDATE 
USING (auth.uid() = usuario_id);

-- Políticas RLS para carteiras
CREATE POLICY "Usuários podem visualizar suas próprias carteiras" 
ON public.carteiras FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias carteiras" 
ON public.carteiras FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias carteiras" 
ON public.carteiras FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir suas próprias carteiras" 
ON public.carteiras FOR DELETE 
USING (auth.uid() = usuario_id);

-- Políticas RLS para movimentações
CREATE POLICY "Usuários podem visualizar suas próprias movimentações" 
ON public.movimentacoes FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias movimentações" 
ON public.movimentacoes FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias movimentações" 
ON public.movimentacoes FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir suas próprias movimentações" 
ON public.movimentacoes FOR DELETE 
USING (auth.uid() = usuario_id);

-- Políticas RLS para metas financeiras
CREATE POLICY "Usuários podem visualizar suas próprias metas" 
ON public.metas_financeiras FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias metas" 
ON public.metas_financeiras FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas" 
ON public.metas_financeiras FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir suas próprias metas" 
ON public.metas_financeiras FOR DELETE 
USING (auth.uid() = usuario_id);

-- Políticas RLS para caixinhas de poupança
CREATE POLICY "Usuários podem visualizar suas próprias caixinhas" 
ON public.caixinhas_poupanca FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias caixinhas" 
ON public.caixinhas_poupanca FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias caixinhas" 
ON public.caixinhas_poupanca FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir suas próprias caixinhas" 
ON public.caixinhas_poupanca FOR DELETE 
USING (auth.uid() = usuario_id);

-- Políticas RLS para histórico de caixinhas
CREATE POLICY "Usuários podem visualizar histórico de suas caixinhas" 
ON public.historico_caixinhas FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.caixinhas_poupanca 
  WHERE id = caixinha_id AND usuario_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir histórico de suas caixinhas" 
ON public.historico_caixinhas FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.caixinhas_poupanca 
  WHERE id = caixinha_id AND usuario_id = auth.uid()
));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER trigger_perfis_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_carteiras_updated_at
  BEFORE UPDATE ON public.carteiras
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_movimentacoes_updated_at
  BEFORE UPDATE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_metas_updated_at
  BEFORE UPDATE ON public.metas_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

CREATE TRIGGER trigger_caixinhas_updated_at
  BEFORE UPDATE ON public.caixinhas_poupanca
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- Trigger para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (usuario_id, nome_completo)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome_completo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_perfil_usuario();

-- Índices para melhor performance
CREATE INDEX idx_carteiras_usuario_id ON public.carteiras(usuario_id);
CREATE INDEX idx_movimentacoes_usuario_id ON public.movimentacoes(usuario_id);
CREATE INDEX idx_movimentacoes_carteira_id ON public.movimentacoes(carteira_id);
CREATE INDEX idx_metas_usuario_id ON public.metas_financeiras(usuario_id);
CREATE INDEX idx_caixinhas_usuario_id ON public.caixinhas_poupanca(usuario_id);
CREATE INDEX idx_historico_caixinha_id ON public.historico_caixinhas(caixinha_id);