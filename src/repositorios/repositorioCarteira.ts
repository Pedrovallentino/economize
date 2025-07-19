import { supabase } from '@/integrations/supabase/client';
import { Carteira } from '@/dominio/Carteira';

/**
 * Interface para dados de criação de carteira
 */
export interface DadosCriacaoCarteira {
  nome: string;
  saldo?: number;
  descricao?: string;
}

/**
 * Interface para dados de atualização de carteira
 */
export interface DadosAtualizacaoCarteira {
  nome?: string;
  saldo?: number;
  descricao?: string;
}

/**
 * Repositório para operações com carteiras no banco de dados
 */
export class RepositorioCarteira {
  /**
   * Cria uma nova carteira
   * @param dados - Dados da carteira a ser criada
   * @returns Promise com a carteira criada
   * @throws Error se houver falha na criação
   */
  async criar(dados: DadosCriacaoCarteira): Promise<Carteira> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('carteiras')
      .insert([
        {
          usuario_id: user.user.id,
          nome: dados.nome,
          saldo: dados.saldo || 0,
          descricao: dados.descricao
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar carteira: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Lista todas as carteiras do usuário
   * @returns Promise com array de carteiras
   */
  async listarTodas(): Promise<Carteira[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('carteiras')
      .select('*')
      .eq('usuario_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar carteiras: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Busca uma carteira por ID
   * @param id - ID da carteira
   * @returns Promise com a carteira encontrada ou null
   */
  async buscarPorId(id: string): Promise<Carteira | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('carteiras')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar carteira: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Atualiza uma carteira
   * @param id - ID da carteira
   * @param dados - Dados a serem atualizados
   * @returns Promise com a carteira atualizada
   * @throws Error se a carteira não for encontrada ou houver falha na atualização
   */
  async atualizar(id: string, dados: DadosAtualizacaoCarteira): Promise<Carteira> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('carteiras')
      .update(dados)
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar carteira: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Exclui uma carteira
   * @param id - ID da carteira
   * @returns Promise<void>
   * @throws Error se houver falha na exclusão
   */
  async excluir(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('carteiras')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.user.id);

    if (error) {
      throw new Error(`Erro ao excluir carteira: ${error.message}`);
    }
  }

  /**
   * Atualiza o saldo de uma carteira
   * @param id - ID da carteira
   * @param novoSaldo - Novo saldo
   * @returns Promise com a carteira atualizada
   */
  async atualizarSaldo(id: string, novoSaldo: number): Promise<Carteira> {
    return this.atualizar(id, { saldo: novoSaldo });
  }

  /**
   * Mapeia dados do banco para objeto de domínio
   * @param data - Dados do banco
   * @returns Instância da classe Carteira
   */
  private mapearParaDominio(data: any): Carteira {
    return new Carteira(
      data.id,
      data.nome,
      parseFloat(data.saldo),
      data.usuario_id,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.descricao
    );
  }
}