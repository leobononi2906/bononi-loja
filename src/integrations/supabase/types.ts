export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assist_causas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      assist_chamado_pecas: {
        Row: {
          chamado_id: number
          codigo_erp: string | null
          criado_em: string | null
          id: number
          nome_peca: string
          observacao: string | null
          peca_id: number | null
          produto_id_erp: number | null
          quantidade: number | null
        }
        Insert: {
          chamado_id: number
          codigo_erp?: string | null
          criado_em?: string | null
          id?: number
          nome_peca: string
          observacao?: string | null
          peca_id?: number | null
          produto_id_erp?: number | null
          quantidade?: number | null
        }
        Update: {
          chamado_id?: number
          codigo_erp?: string | null
          criado_em?: string | null
          id?: number
          nome_peca?: string
          observacao?: string | null
          peca_id?: number | null
          produto_id_erp?: number | null
          quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assist_chamado_pecas_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamado_pecas_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_chamados_detalhe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamado_pecas_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamado_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "assist_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      assist_chamados: {
        Row: {
          atualizado_em: string | null
          bloqueado: boolean | null
          causa_id: number | null
          cliente_id_erp: number | null
          cliente_nome_erp: string | null
          cliente_vinculado_manual: boolean | null
          concluido: boolean | null
          criado_em: string | null
          data_abertura: string | null
          data_conclusao: string | null
          data_proxima_acao: string | null
          data_ultimo_followup: string | null
          defeito_id: number | null
          descricao_inicial: string | null
          id: number
          id_atendente_umbler: string | null
          inbox_umbler: string | null
          justificativa_cliente_nao_vinculado: string | null
          natureza: string | null
          nome_atendente_umbler: string | null
          nome_contato: string | null
          observacao_interna: string | null
          origem_tag: string | null
          prioridade_id: number | null
          procedencia_id: number | null
          produto_codigo: string | null
          produto_id_erp: number | null
          produto_manual: string | null
          produto_nome: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          setor_responsavel_id: number | null
          solucao_id: number | null
          status_id: number | null
          tags_umbler: Json | null
          telefone: string
          telefone_normalizado: string | null
          umbler_conversa_id: string | null
          umbler_mensagem_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bloqueado?: boolean | null
          causa_id?: number | null
          cliente_id_erp?: number | null
          cliente_nome_erp?: string | null
          cliente_vinculado_manual?: boolean | null
          concluido?: boolean | null
          criado_em?: string | null
          data_abertura?: string | null
          data_conclusao?: string | null
          data_proxima_acao?: string | null
          data_ultimo_followup?: string | null
          defeito_id?: number | null
          descricao_inicial?: string | null
          id?: number
          id_atendente_umbler?: string | null
          inbox_umbler?: string | null
          justificativa_cliente_nao_vinculado?: string | null
          natureza?: string | null
          nome_atendente_umbler?: string | null
          nome_contato?: string | null
          observacao_interna?: string | null
          origem_tag?: string | null
          prioridade_id?: number | null
          procedencia_id?: number | null
          produto_codigo?: string | null
          produto_id_erp?: number | null
          produto_manual?: string | null
          produto_nome?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          setor_responsavel_id?: number | null
          solucao_id?: number | null
          status_id?: number | null
          tags_umbler?: Json | null
          telefone: string
          telefone_normalizado?: string | null
          umbler_conversa_id?: string | null
          umbler_mensagem_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bloqueado?: boolean | null
          causa_id?: number | null
          cliente_id_erp?: number | null
          cliente_nome_erp?: string | null
          cliente_vinculado_manual?: boolean | null
          concluido?: boolean | null
          criado_em?: string | null
          data_abertura?: string | null
          data_conclusao?: string | null
          data_proxima_acao?: string | null
          data_ultimo_followup?: string | null
          defeito_id?: number | null
          descricao_inicial?: string | null
          id?: number
          id_atendente_umbler?: string | null
          inbox_umbler?: string | null
          justificativa_cliente_nao_vinculado?: string | null
          natureza?: string | null
          nome_atendente_umbler?: string | null
          nome_contato?: string | null
          observacao_interna?: string | null
          origem_tag?: string | null
          prioridade_id?: number | null
          procedencia_id?: number | null
          produto_codigo?: string | null
          produto_id_erp?: number | null
          produto_manual?: string | null
          produto_nome?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          setor_responsavel_id?: number | null
          solucao_id?: number | null
          status_id?: number | null
          tags_umbler?: Json | null
          telefone?: string
          telefone_normalizado?: string | null
          umbler_conversa_id?: string | null
          umbler_mensagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assist_chamados_causa_id_fkey"
            columns: ["causa_id"]
            isOneToOne: false
            referencedRelation: "assist_causas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_defeito_id_fkey"
            columns: ["defeito_id"]
            isOneToOne: false
            referencedRelation: "assist_defeitos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["prioridade_id"]
          },
          {
            foreignKeyName: "assist_chamados_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "assist_prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_procedencia_id_fkey"
            columns: ["procedencia_id"]
            isOneToOne: false
            referencedRelation: "assist_procedencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_setor_responsavel_id_fkey"
            columns: ["setor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["setor_responsavel_id"]
          },
          {
            foreignKeyName: "assist_chamados_setor_responsavel_id_fkey"
            columns: ["setor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "assist_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_solucao_id_fkey"
            columns: ["solucao_id"]
            isOneToOne: false
            referencedRelation: "assist_solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["status_id"]
          },
          {
            foreignKeyName: "assist_chamados_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "assist_status"
            referencedColumns: ["id"]
          },
        ]
      }
      assist_defeitos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      assist_followups: {
        Row: {
          chamado_id: number
          criado_em: string | null
          id: number
          mensagem: string
          origem: string | null
          tipo: string | null
          umbler_mensagem_id: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          chamado_id: number
          criado_em?: string | null
          id?: number
          mensagem: string
          origem?: string | null
          tipo?: string | null
          umbler_mensagem_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          chamado_id?: number
          criado_em?: string | null
          id?: number
          mensagem?: string
          origem?: string | null
          tipo?: string | null
          umbler_mensagem_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assist_followups_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_followups_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_chamados_detalhe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_followups_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["id"]
          },
        ]
      }
      assist_numeros_bloqueados: {
        Row: {
          ativo: boolean | null
          bloqueado_em: string | null
          bloqueado_por: string | null
          desbloqueado_em: string | null
          desbloqueado_por: string | null
          id: number
          motivo: string | null
          telefone: string
          telefone_norm: string
        }
        Insert: {
          ativo?: boolean | null
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          desbloqueado_em?: string | null
          desbloqueado_por?: string | null
          id?: never
          motivo?: string | null
          telefone: string
          telefone_norm: string
        }
        Update: {
          ativo?: boolean | null
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          desbloqueado_em?: string | null
          desbloqueado_por?: string | null
          id?: never
          motivo?: string | null
          telefone?: string
          telefone_norm?: string
        }
        Relationships: []
      }
      assist_pecas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          codigo_erp: string | null
          criado_em: string | null
          id: number
          nome_peca: string
          produto_id_erp: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          codigo_erp?: string | null
          criado_em?: string | null
          id?: number
          nome_peca: string
          produto_id_erp?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          codigo_erp?: string | null
          criado_em?: string | null
          id?: number
          nome_peca?: string
          produto_id_erp?: number | null
        }
        Relationships: []
      }
      assist_prioridades: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: number
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      assist_procedencias: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      assist_produtos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string | null
          grupo: string | null
          id: number
          id_produto_erp: number | null
          nome: string
          referencia: string | null
          subgrupo: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          grupo?: string | null
          id?: never
          id_produto_erp?: number | null
          nome: string
          referencia?: string | null
          subgrupo?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          grupo?: string | null
          id?: never
          id_produto_erp?: number | null
          nome?: string
          referencia?: string | null
          subgrupo?: string | null
        }
        Relationships: []
      }
      assist_produtos_favoritos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          codigo_erp: string | null
          criado_em: string | null
          familia: string | null
          id: number
          marca: string | null
          nome_produto: string
          produto_id_erp: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          codigo_erp?: string | null
          criado_em?: string | null
          familia?: string | null
          id?: number
          marca?: string | null
          nome_produto: string
          produto_id_erp?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          codigo_erp?: string | null
          criado_em?: string | null
          familia?: string | null
          id?: number
          marca?: string | null
          nome_produto?: string
          produto_id_erp?: number | null
        }
        Relationships: []
      }
      assist_setores: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      assist_solucoes: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      assist_status: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cor: string | null
          criado_em: string | null
          finaliza_chamado: boolean | null
          id: number
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          finaliza_chamado?: boolean | null
          id?: number
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          finaliza_chamado?: boolean | null
          id?: number
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      assist_webhook_debug: {
        Row: {
          criado_em: string | null
          id: number
          payload: Json | null
        }
        Insert: {
          criado_em?: string | null
          id?: number
          payload?: Json | null
        }
        Update: {
          criado_em?: string | null
          id?: number
          payload?: Json | null
        }
        Relationships: []
      }
      assistencia_usuarios: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          nome: string
          perfil: string
          senha_hash: string
          usuario: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          nome: string
          perfil?: string
          senha_hash: string
          usuario: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          nome?: string
          perfil?: string
          senha_hash?: string
          usuario?: string
        }
        Relationships: []
      }
      atac_cliente_telefones: {
        Row: {
          cargo: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          id_cliente: number
          nome_cliente: string | null
          nome_contato: string | null
          principal: boolean | null
          telefone: string
        }
        Insert: {
          cargo?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          id_cliente: number
          nome_cliente?: string | null
          nome_contato?: string | null
          principal?: boolean | null
          telefone: string
        }
        Update: {
          cargo?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          id_cliente?: number
          nome_cliente?: string | null
          nome_contato?: string | null
          principal?: boolean | null
          telefone?: string
        }
        Relationships: []
      }
      atac_cliente_vendedor: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          id: string
          id_cliente: number
          id_vendedor_responsavel: number | null
          nome_cliente: string | null
          nome_vendedor_responsavel: string | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          id?: string
          id_cliente: number
          id_vendedor_responsavel?: number | null
          nome_cliente?: string | null
          nome_vendedor_responsavel?: string | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          id?: string
          id_cliente?: number
          id_vendedor_responsavel?: number | null
          nome_cliente?: string | null
          nome_vendedor_responsavel?: string | null
        }
        Relationships: []
      }
      atac_cliente_vinculos: {
        Row: {
          cnpj_cpf_erp: string | null
          id: string
          id_cliente_crm: number
          id_cliente_erp: number
          nome_cliente_erp: string | null
          vinculado_em: string | null
          vinculado_por: string | null
        }
        Insert: {
          cnpj_cpf_erp?: string | null
          id?: string
          id_cliente_crm: number
          id_cliente_erp: number
          nome_cliente_erp?: string | null
          vinculado_em?: string | null
          vinculado_por?: string | null
        }
        Update: {
          cnpj_cpf_erp?: string | null
          id?: string
          id_cliente_crm?: number
          id_cliente_erp?: number
          nome_cliente_erp?: string | null
          vinculado_em?: string | null
          vinculado_por?: string | null
        }
        Relationships: []
      }
      atac_clientes: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          contato: string | null
          criado_em: string | null
          email: string | null
          endereco: string | null
          id: string
          id_cliente: number | null
          latitude: number | null
          longitude: number | null
          nome_cliente: string | null
          origem: string | null
          situacao: string | null
          telefone1: string | null
          telefone2: string | null
          telefone3: string | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_cliente?: number | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente?: string | null
          origem?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_cliente?: number | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente?: string | null
          origem?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      atac_clientes_historico: {
        Row: {
          cidade: string | null
          cnpj_cpf: string | null
          criado_em: string | null
          descartado: boolean | null
          descartado_em: string | null
          descartado_por: string | null
          excluido: boolean | null
          excluido_em: string | null
          excluido_por: string | null
          id: number
          id_cliente_erp: number | null
          id_cliente_erp_vinculado: number | null
          motivo_descarte: string | null
          motivo_exclusao: string | null
          nome_cliente: string
          origem: string | null
          uf: string | null
          ultima_compra_anterior: string | null
          vinculado_em: string | null
          vinculado_erp: boolean | null
        }
        Insert: {
          cidade?: string | null
          cnpj_cpf?: string | null
          criado_em?: string | null
          descartado?: boolean | null
          descartado_em?: string | null
          descartado_por?: string | null
          excluido?: boolean | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: number
          id_cliente_erp?: number | null
          id_cliente_erp_vinculado?: number | null
          motivo_descarte?: string | null
          motivo_exclusao?: string | null
          nome_cliente: string
          origem?: string | null
          uf?: string | null
          ultima_compra_anterior?: string | null
          vinculado_em?: string | null
          vinculado_erp?: boolean | null
        }
        Update: {
          cidade?: string | null
          cnpj_cpf?: string | null
          criado_em?: string | null
          descartado?: boolean | null
          descartado_em?: string | null
          descartado_por?: string | null
          excluido?: boolean | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: number
          id_cliente_erp?: number | null
          id_cliente_erp_vinculado?: number | null
          motivo_descarte?: string | null
          motivo_exclusao?: string | null
          nome_cliente?: string
          origem?: string | null
          uf?: string | null
          ultima_compra_anterior?: string | null
          vinculado_em?: string | null
          vinculado_erp?: boolean | null
        }
        Relationships: []
      }
      atac_crm_notas: {
        Row: {
          criado_por: string | null
          data_criacao: string | null
          data_prevista: string | null
          data_resolucao: string | null
          id: string
          id_cliente: number
          id_vendedor: number | null
          id_vendedor_responsavel: number | null
          nome_cliente: string | null
          nome_vendedor: string | null
          nome_vendedor_responsavel: string | null
          resolvido: boolean | null
          texto: string
          tipo: string
        }
        Insert: {
          criado_por?: string | null
          data_criacao?: string | null
          data_prevista?: string | null
          data_resolucao?: string | null
          id?: string
          id_cliente: number
          id_vendedor?: number | null
          id_vendedor_responsavel?: number | null
          nome_cliente?: string | null
          nome_vendedor?: string | null
          nome_vendedor_responsavel?: string | null
          resolvido?: boolean | null
          texto: string
          tipo: string
        }
        Update: {
          criado_por?: string | null
          data_criacao?: string | null
          data_prevista?: string | null
          data_resolucao?: string | null
          id?: string
          id_cliente?: number
          id_vendedor?: number | null
          id_vendedor_responsavel?: number | null
          nome_cliente?: string | null
          nome_vendedor?: string | null
          nome_vendedor_responsavel?: string | null
          resolvido?: boolean | null
          texto?: string
          tipo?: string
        }
        Relationships: []
      }
      atac_umbler_contatos: {
        Row: {
          atualizado_em: string | null
          id: string
          id_atendente_umbler: string | null
          id_conversa_umbler: string | null
          inbox: string | null
          inbox_umbler: string | null
          motivo_nao_comercial: string | null
          nao_comercial: boolean | null
          nome_atendente: string | null
          nome_contato: string | null
          telefone: string
          ultimo_contato: string | null
        }
        Insert: {
          atualizado_em?: string | null
          id?: string
          id_atendente_umbler?: string | null
          id_conversa_umbler?: string | null
          inbox?: string | null
          inbox_umbler?: string | null
          motivo_nao_comercial?: string | null
          nao_comercial?: boolean | null
          nome_atendente?: string | null
          nome_contato?: string | null
          telefone: string
          ultimo_contato?: string | null
        }
        Update: {
          atualizado_em?: string | null
          id?: string
          id_atendente_umbler?: string | null
          id_conversa_umbler?: string | null
          inbox?: string | null
          inbox_umbler?: string | null
          motivo_nao_comercial?: string | null
          nao_comercial?: boolean | null
          nome_atendente?: string | null
          nome_contato?: string | null
          telefone?: string
          ultimo_contato?: string | null
        }
        Relationships: []
      }
      atac_umbler_vendedor: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          id_membro_umbler: string | null
          id_vendedor_erp: number
          inbox_umbler: string | null
          nome_vendedor_erp: string | null
          usuario_umbler: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          id_membro_umbler?: string | null
          id_vendedor_erp: number
          inbox_umbler?: string | null
          nome_vendedor_erp?: string | null
          usuario_umbler: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          id_membro_umbler?: string | null
          id_vendedor_erp?: number
          inbox_umbler?: string | null
          nome_vendedor_erp?: string | null
          usuario_umbler?: string
        }
        Relationships: []
      }
      atac_usuarios: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          email: string
          id: string
          id_vendedor_erp: number | null
          nome: string
          nome_vendedor: string | null
          perfil: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          email: string
          id: string
          id_vendedor_erp?: number | null
          nome: string
          nome_vendedor?: string | null
          perfil?: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          email?: string
          id?: string
          id_vendedor_erp?: number | null
          nome?: string
          nome_vendedor?: string | null
          perfil?: string
        }
        Relationships: []
      }
      atac_webhook_debug: {
        Row: {
          criado_em: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      bononi_indica_audit_log: {
        Row: {
          alterado_por: string | null
          campo: string
          data_alteracao: string | null
          id: string
          registro_id: string
          tabela: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_por?: string | null
          campo: string
          data_alteracao?: string | null
          id?: string
          registro_id: string
          tabela: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_por?: string | null
          campo?: string
          data_alteracao?: string | null
          id?: string
          registro_id?: string
          tabela?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      bononi_indica_clientes: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          cod_cliente: number | null
          cpf: string
          data_cadastro: string | null
          email: string | null
          id: string
          id_cliente_erp: number | null
          nome: string | null
          observacao: string | null
          saldo_dinheiro: number | null
          saldo_produto: number | null
          telefone: string | null
          total_conversoes: number | null
          total_ganho_dinheiro: number | null
          total_ganho_produto: number | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          cod_cliente?: number | null
          cpf: string
          data_cadastro?: string | null
          email?: string | null
          id?: string
          id_cliente_erp?: number | null
          nome?: string | null
          observacao?: string | null
          saldo_dinheiro?: number | null
          saldo_produto?: number | null
          telefone?: string | null
          total_conversoes?: number | null
          total_ganho_dinheiro?: number | null
          total_ganho_produto?: number | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          cod_cliente?: number | null
          cpf?: string
          data_cadastro?: string | null
          email?: string | null
          id?: string
          id_cliente_erp?: number | null
          nome?: string | null
          observacao?: string | null
          saldo_dinheiro?: number | null
          saldo_produto?: number | null
          telefone?: string | null
          total_conversoes?: number | null
          total_ganho_dinheiro?: number | null
          total_ganho_produto?: number | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bononi_indica_resgates: {
        Row: {
          aprovado_por: string | null
          chave_pix: string | null
          codigo_produto: string | null
          data_aprovacao: string | null
          data_pagamento: string | null
          data_solicitacao: string | null
          id: string
          id_cliente: string
          observacao: string | null
          origem: string
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          aprovado_por?: string | null
          chave_pix?: string | null
          codigo_produto?: string | null
          data_aprovacao?: string | null
          data_pagamento?: string | null
          data_solicitacao?: string | null
          id?: string
          id_cliente: string
          observacao?: string | null
          origem: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          aprovado_por?: string | null
          chave_pix?: string | null
          codigo_produto?: string | null
          data_aprovacao?: string | null
          data_pagamento?: string | null
          data_solicitacao?: string | null
          id?: string
          id_cliente?: string
          observacao?: string | null
          origem?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "bononi_indica_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      bononi_indica_vendas: {
        Row: {
          comissao_dinheiro: number
          comissao_produto: number
          data_lancamento: string | null
          data_venda: string | null
          id: string
          id_cliente_indicador: string
          id_doc_erp: number | null
          lancado_por: string | null
          nome_comprador: string | null
          numero_nf: string | null
          observacao: string | null
          updated_at: string | null
          valor_venda: number
        }
        Insert: {
          comissao_dinheiro: number
          comissao_produto: number
          data_lancamento?: string | null
          data_venda?: string | null
          id?: string
          id_cliente_indicador: string
          id_doc_erp?: number | null
          lancado_por?: string | null
          nome_comprador?: string | null
          numero_nf?: string | null
          observacao?: string | null
          updated_at?: string | null
          valor_venda: number
        }
        Update: {
          comissao_dinheiro?: number
          comissao_produto?: number
          data_lancamento?: string | null
          data_venda?: string | null
          id?: string
          id_cliente_indicador?: string
          id_doc_erp?: number | null
          lancado_por?: string | null
          nome_comprador?: string | null
          numero_nf?: string | null
          observacao?: string | null
          updated_at?: string | null
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "bononi_indica_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      bononi_perfis: {
        Row: {
          acessos: Json
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          submodulos: Json
        }
        Insert: {
          acessos?: Json
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          submodulos?: Json
        }
        Update: {
          acessos?: Json
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          submodulos?: Json
        }
        Relationships: []
      }
      bononi_usuarios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          auth_user_id: string | null
          criado_em: string | null
          email: string
          empresa_padrao: number | null
          id: string
          nome: string
          perfil_id: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email: string
          empresa_padrao?: number | null
          id?: string
          nome: string
          perfil_id?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          auth_user_id?: string | null
          criado_em?: string | null
          email?: string
          empresa_padrao?: number | null
          id?: string
          nome?: string
          perfil_id?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bononi_usuarios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "bononi_perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      cob_acoes: {
        Row: {
          created_at: string | null
          data_acao: string
          data_protocolo: string | null
          fin_cr_id: number
          id: number
          id_contato: number
          observacao: string | null
          operador_id: number | null
          protocolo_numero: string | null
          resultado: string | null
          status_protocolo: string | null
          tipo_acao: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_acao?: string
          data_protocolo?: string | null
          fin_cr_id: number
          id?: number
          id_contato: number
          observacao?: string | null
          operador_id?: number | null
          protocolo_numero?: string | null
          resultado?: string | null
          status_protocolo?: string | null
          tipo_acao: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_acao?: string
          data_protocolo?: string | null
          fin_cr_id?: number
          id?: number
          id_contato?: number
          observacao?: string | null
          operador_id?: number | null
          protocolo_numero?: string | null
          resultado?: string | null
          status_protocolo?: string | null
          tipo_acao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cob_acoes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "cob_operadores"
            referencedColumns: ["id"]
          },
        ]
      }
      cob_forma_pag: {
        Row: {
          chforma_pag: number | null
          id_mov: number
        }
        Insert: {
          chforma_pag?: number | null
          id_mov: number
        }
        Update: {
          chforma_pag?: number | null
          id_mov?: number
        }
        Relationships: []
      }
      cob_operadores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: number
          nome: string
          perfil: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: number
          nome: string
          perfil?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: number
          nome?: string
          perfil?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cob_pagamentos_pendentes: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          data_pagamento: string
          fin_cr_id: number
          id: number
          id_contato: number
          observacao: string | null
          operador_id: number
          updated_at: string | null
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          data_pagamento: string
          fin_cr_id: number
          id?: number
          id_contato: number
          observacao?: string | null
          operador_id: number
          updated_at?: string | null
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          data_pagamento?: string
          fin_cr_id?: number
          id?: number
          id_contato?: number
          observacao?: string | null
          operador_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cob_pagamentos_pendentes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "cob_operadores"
            referencedColumns: ["id"]
          },
        ]
      }
      cob_tarefas: {
        Row: {
          cob_acao_id: number | null
          created_at: string | null
          data_agendada: string
          data_execucao: string | null
          fase_cobranca: string | null
          fin_cr_id: number
          id: number
          id_contato: number
          observacao: string | null
          operador_responsavel: number | null
          status: string
          tipo_tarefa: string
          updated_at: string | null
        }
        Insert: {
          cob_acao_id?: number | null
          created_at?: string | null
          data_agendada: string
          data_execucao?: string | null
          fase_cobranca?: string | null
          fin_cr_id: number
          id?: number
          id_contato: number
          observacao?: string | null
          operador_responsavel?: number | null
          status?: string
          tipo_tarefa: string
          updated_at?: string | null
        }
        Update: {
          cob_acao_id?: number | null
          created_at?: string | null
          data_agendada?: string
          data_execucao?: string | null
          fase_cobranca?: string | null
          fin_cr_id?: number
          id?: number
          id_contato?: number
          observacao?: string | null
          operador_responsavel?: number | null
          status?: string
          tipo_tarefa?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cob_tarefas_cob_acao_id_fkey"
            columns: ["cob_acao_id"]
            isOneToOne: false
            referencedRelation: "cob_acoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cob_tarefas_cob_acao_id_fkey"
            columns: ["cob_acao_id"]
            isOneToOne: false
            referencedRelation: "cob_historico_acoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cob_tarefas_operador_responsavel_fkey"
            columns: ["operador_responsavel"]
            isOneToOne: false
            referencedRelation: "cob_operadores"
            referencedColumns: ["id"]
          },
        ]
      }
      cob_whatsapp_enviados: {
        Row: {
          created_at: string | null
          data_envio: string
          fin_cr_id: number
          id: number
          id_contato: number
          resultado: string | null
          tipo_mensagem: string
        }
        Insert: {
          created_at?: string | null
          data_envio: string
          fin_cr_id: number
          id?: number
          id_contato: number
          resultado?: string | null
          tipo_mensagem: string
        }
        Update: {
          created_at?: string | null
          data_envio?: string
          fin_cr_id?: number
          id?: number
          id_contato?: number
          resultado?: string | null
          tipo_mensagem?: string
        }
        Relationships: []
      }
      cob_whatsapp_respostas: {
        Row: {
          created_at: string | null
          data_recebimento: string
          fin_cr_id: number
          id: number
          id_contato: number
          lida_operadora: boolean | null
          mensagem_recebida: string
          resposta_operadora: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_recebimento: string
          fin_cr_id: number
          id?: number
          id_contato: number
          lida_operadora?: boolean | null
          mensagem_recebida: string
          resposta_operadora?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_recebimento?: string
          fin_cr_id?: number
          id?: number
          id_contato?: number
          lida_operadora?: boolean | null
          mensagem_recebida?: string
          resposta_operadora?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comp_balanco_contagem: {
        Row: {
          centro_estoque: string | null
          contado_em: string | null
          contado_por: string | null
          descricao_sessao: string | null
          divergencia: number | null
          empresa: string | null
          finalizado: boolean | null
          id: number
          id_centro: number | null
          id_empresa: number
          id_produto: number
          id_sessao: string
          nome_produto: string | null
          observacao: string | null
          qtd_contada: number
          qtd_sistema: number | null
          referencia: string | null
        }
        Insert: {
          centro_estoque?: string | null
          contado_em?: string | null
          contado_por?: string | null
          descricao_sessao?: string | null
          divergencia?: number | null
          empresa?: string | null
          finalizado?: boolean | null
          id?: number
          id_centro?: number | null
          id_empresa: number
          id_produto: number
          id_sessao?: string
          nome_produto?: string | null
          observacao?: string | null
          qtd_contada: number
          qtd_sistema?: number | null
          referencia?: string | null
        }
        Update: {
          centro_estoque?: string | null
          contado_em?: string | null
          contado_por?: string | null
          descricao_sessao?: string | null
          divergencia?: number | null
          empresa?: string | null
          finalizado?: boolean | null
          id?: number
          id_centro?: number | null
          id_empresa?: number
          id_produto?: number
          id_sessao?: string
          nome_produto?: string | null
          observacao?: string | null
          qtd_contada?: number
          qtd_sistema?: number | null
          referencia?: string | null
        }
        Relationships: []
      }
      comp_historico_m2: {
        Row: {
          "abr/25": number | null
          "ago/25": number | null
          Codigo: string | null
          Descricao: string | null
          "dez/24": number | null
          ESTOQUE: string | null
          "fev/25": number | null
          "jan/25": number | null
          "jul/25": number | null
          "jun/25": number | null
          "mai/25": number | null
          "mar/25": number | null
          "nov/24": number | null
          "out/25": number | null
          "set/25": number | null
          TOTAL: string | null
          UN: string | null
        }
        Insert: {
          "abr/25"?: number | null
          "ago/25"?: number | null
          Codigo?: string | null
          Descricao?: string | null
          "dez/24"?: number | null
          ESTOQUE?: string | null
          "fev/25"?: number | null
          "jan/25"?: number | null
          "jul/25"?: number | null
          "jun/25"?: number | null
          "mai/25"?: number | null
          "mar/25"?: number | null
          "nov/24"?: number | null
          "out/25"?: number | null
          "set/25"?: number | null
          TOTAL?: string | null
          UN?: string | null
        }
        Update: {
          "abr/25"?: number | null
          "ago/25"?: number | null
          Codigo?: string | null
          Descricao?: string | null
          "dez/24"?: number | null
          ESTOQUE?: string | null
          "fev/25"?: number | null
          "jan/25"?: number | null
          "jul/25"?: number | null
          "jun/25"?: number | null
          "mai/25"?: number | null
          "mar/25"?: number | null
          "nov/24"?: number | null
          "out/25"?: number | null
          "set/25"?: number | null
          TOTAL?: string | null
          UN?: string | null
        }
        Relationships: []
      }
      compras_ia_sugestao_itens: {
        Row: {
          cobertura_dias: number | null
          consumo_diario: number | null
          criado_em: string
          curva_abc: string | null
          estoque_atual: number | null
          fornecedor_nome: string | null
          id: string
          id_fornecedor: number | null
          id_produto: number | null
          metadados: Json
          motivo_sugestao: string | null
          observacoes: string | null
          pedido_aberto: number | null
          preco_unitario: number | null
          produto_nome: string | null
          qtd_confirmada: number | null
          qtd_sugerida_ia: number
          referencia: string | null
          situacao_estoque: string | null
          sugestao_id: string
          valor_total_estimado: number | null
        }
        Insert: {
          cobertura_dias?: number | null
          consumo_diario?: number | null
          criado_em?: string
          curva_abc?: string | null
          estoque_atual?: number | null
          fornecedor_nome?: string | null
          id?: string
          id_fornecedor?: number | null
          id_produto?: number | null
          metadados?: Json
          motivo_sugestao?: string | null
          observacoes?: string | null
          pedido_aberto?: number | null
          preco_unitario?: number | null
          produto_nome?: string | null
          qtd_confirmada?: number | null
          qtd_sugerida_ia?: number
          referencia?: string | null
          situacao_estoque?: string | null
          sugestao_id: string
          valor_total_estimado?: number | null
        }
        Update: {
          cobertura_dias?: number | null
          consumo_diario?: number | null
          criado_em?: string
          curva_abc?: string | null
          estoque_atual?: number | null
          fornecedor_nome?: string | null
          id?: string
          id_fornecedor?: number | null
          id_produto?: number | null
          metadados?: Json
          motivo_sugestao?: string | null
          observacoes?: string | null
          pedido_aberto?: number | null
          preco_unitario?: number | null
          produto_nome?: string | null
          qtd_confirmada?: number | null
          qtd_sugerida_ia?: number
          referencia?: string | null
          situacao_estoque?: string | null
          sugestao_id?: string
          valor_total_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_ia_sugestao_itens_sugestao_id_fkey"
            columns: ["sugestao_id"]
            isOneToOne: false
            referencedRelation: "compras_ia_sugestoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_ia_sugestao_itens_sugestao_id_fkey"
            columns: ["sugestao_id"]
            isOneToOne: false
            referencedRelation: "vw_compras_ia_sugestoes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_ia_sugestoes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          fornecedor_nome: string | null
          id: string
          id_fornecedor: number | null
          metadados: Json
          numero_sugestao: string | null
          observacoes: string | null
          origem: string
          pergunta_usuario: string | null
          resposta_ia: string | null
          status: string
          total_itens: number
          valor_total_estimado: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          fornecedor_nome?: string | null
          id?: string
          id_fornecedor?: number | null
          metadados?: Json
          numero_sugestao?: string | null
          observacoes?: string | null
          origem?: string
          pergunta_usuario?: string | null
          resposta_ia?: string | null
          status?: string
          total_itens?: number
          valor_total_estimado?: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          fornecedor_nome?: string | null
          id?: string
          id_fornecedor?: number | null
          metadados?: Json
          numero_sugestao?: string | null
          observacoes?: string | null
          origem?: string
          pergunta_usuario?: string | null
          resposta_ia?: string | null
          status?: string
          total_itens?: number
          valor_total_estimado?: number
        }
        Relationships: []
      }
      ecom_campanha_subgrupo: {
        Row: {
          campanha: string | null
          created_at: string | null
          id: number
          subgrupo_produto: string | null
          updated_at: string | null
        }
        Insert: {
          campanha?: string | null
          created_at?: string | null
          id?: number
          subgrupo_produto?: string | null
          updated_at?: string | null
        }
        Update: {
          campanha?: string | null
          created_at?: string | null
          id?: number
          subgrupo_produto?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ecom_clientes_tel: {
        Row: {
          id_cliente: number
          tel1_norm: string | null
          tel2_norm: string | null
          tel3_norm: string | null
          updated_at: string | null
        }
        Insert: {
          id_cliente: number
          tel1_norm?: string | null
          tel2_norm?: string | null
          tel3_norm?: string | null
          updated_at?: string | null
        }
        Update: {
          id_cliente?: number
          tel1_norm?: string | null
          tel2_norm?: string | null
          tel3_norm?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ecom_debug_webhook: {
        Row: {
          criado_em: string | null
          id: number
          payload: Json | null
        }
        Insert: {
          criado_em?: string | null
          id?: number
          payload?: Json | null
        }
        Update: {
          criado_em?: string | null
          id?: number
          payload?: Json | null
        }
        Relationships: []
      }
      ecom_influencers: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          cupom_desconto: string | null
          data_fim_contrato: string | null
          data_inicio_contrato: string | null
          engajamento_perc: number | null
          entregas_acordadas: string | null
          facebook: string | null
          id: string
          instagram: string | null
          motivo_proximo_contato: string | null
          nicho: string | null
          nome: string
          observacoes: string | null
          produtos_parceria: string[] | null
          proximo_contato: string | null
          seguidores_instagram: number | null
          seguidores_tiktok: number | null
          seguidores_youtube: number | null
          status: string | null
          telefone: string | null
          tiktok: string | null
          tipo_contrato: string | null
          ultimo_contato: string | null
          valor_pago: number | null
          youtube: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          cupom_desconto?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          engajamento_perc?: number | null
          entregas_acordadas?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          motivo_proximo_contato?: string | null
          nicho?: string | null
          nome: string
          observacoes?: string | null
          produtos_parceria?: string[] | null
          proximo_contato?: string | null
          seguidores_instagram?: number | null
          seguidores_tiktok?: number | null
          seguidores_youtube?: number | null
          status?: string | null
          telefone?: string | null
          tiktok?: string | null
          tipo_contrato?: string | null
          ultimo_contato?: string | null
          valor_pago?: number | null
          youtube?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          cupom_desconto?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          engajamento_perc?: number | null
          entregas_acordadas?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          motivo_proximo_contato?: string | null
          nicho?: string | null
          nome?: string
          observacoes?: string | null
          produtos_parceria?: string[] | null
          proximo_contato?: string | null
          seguidores_instagram?: number | null
          seguidores_tiktok?: number | null
          seguidores_youtube?: number | null
          status?: string | null
          telefone?: string | null
          tiktok?: string | null
          tipo_contrato?: string | null
          ultimo_contato?: string | null
          valor_pago?: number | null
          youtube?: string | null
        }
        Relationships: []
      }
      ecom_leads: {
        Row: {
          campanha_meta: string | null
          convertido: boolean | null
          convertido_em: string | null
          criado_em: string | null
          etapa: string | null
          id: string
          id_venda: string | null
          id_vendedor: string | null
          nome: string | null
          nome_vendedor: string | null
          tags: string[] | null
          telefone: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_venda: number | null
        }
        Insert: {
          campanha_meta?: string | null
          convertido?: boolean | null
          convertido_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id: string
          id_venda?: string | null
          id_vendedor?: string | null
          nome?: string | null
          nome_vendedor?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_venda?: number | null
        }
        Update: {
          campanha_meta?: string | null
          convertido?: boolean | null
          convertido_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id?: string
          id_venda?: string | null
          id_vendedor?: string | null
          nome?: string | null
          nome_vendedor?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      ecom_leads_fila_bot: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          etapa: string | null
          id: string
          nome: string | null
          telefone: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id: string
          nome?: string | null
          telefone: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id?: string
          nome?: string | null
          telefone?: string
        }
        Relationships: []
      }
      ecom_meta_ads: {
        Row: {
          campanha: string
          cliques: number | null
          conjunto: string
          data: string
          impressoes: number | null
          investimento: number | null
          leads: number | null
        }
        Insert: {
          campanha: string
          cliques?: number | null
          conjunto: string
          data: string
          impressoes?: number | null
          investimento?: number | null
          leads?: number | null
        }
        Update: {
          campanha?: string
          cliques?: number | null
          conjunto?: string
          data?: string
          impressoes?: number | null
          investimento?: number | null
          leads?: number | null
        }
        Relationships: []
      }
      ecom_tintim_leads: {
        Row: {
          anuncio: string | null
          atualizado_em: string | null
          campanha: string | null
          conjunto: string | null
          criado_em: string | null
          id: string
          nome: string | null
          status_id: number | null
          status_nome: string | null
          telefone: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_venda: number | null
        }
        Insert: {
          anuncio?: string | null
          atualizado_em?: string | null
          campanha?: string | null
          conjunto?: string | null
          criado_em?: string | null
          id?: string
          nome?: string | null
          status_id?: number | null
          status_nome?: string | null
          telefone: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_venda?: number | null
        }
        Update: {
          anuncio?: string | null
          atualizado_em?: string | null
          campanha?: string | null
          conjunto?: string | null
          criado_em?: string | null
          id?: string
          nome?: string | null
          status_id?: number | null
          status_nome?: string | null
          telefone?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      ecom_umbler_vendedor: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id_membro_umbler: string
          id_vendedor_erp: number | null
          nome_vendedor_erp: string | null
          nome_vendedor_erp_completo: string | null
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id_membro_umbler: string
          id_vendedor_erp?: number | null
          nome_vendedor_erp?: string | null
          nome_vendedor_erp_completo?: string | null
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id_membro_umbler?: string
          id_vendedor_erp?: number | null
          nome_vendedor_erp?: string | null
          nome_vendedor_erp_completo?: string | null
        }
        Relationships: []
      }
      fin_cc_classificacao: {
        Row: {
          canal: string | null
          descricao_cc: string | null
          id_centro_custo: number
        }
        Insert: {
          canal?: string | null
          descricao_cc?: string | null
          id_centro_custo: number
        }
        Update: {
          canal?: string | null
          descricao_cc?: string | null
          id_centro_custo?: number
        }
        Relationships: []
      }
      fin_saldo_inicial: {
        Row: {
          data_referencia: string | null
          id: number
          observacao: string | null
          saldo_abertura: number | null
        }
        Insert: {
          data_referencia?: string | null
          id?: number
          observacao?: string | null
          saldo_abertura?: number | null
        }
        Update: {
          data_referencia?: string | null
          id?: number
          observacao?: string | null
          saldo_abertura?: number | null
        }
        Relationships: []
      }
      frt_adicionais: {
        Row: {
          ativo: boolean | null
          automatico: boolean | null
          codigo: string
          criado_em: string | null
          descricao: string
          id: number
          id_contrato: number
          tipo_calculo: string
          uf_especifica: string | null
          valor: number | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          automatico?: boolean | null
          codigo: string
          criado_em?: string | null
          descricao: string
          id?: number
          id_contrato: number
          tipo_calculo: string
          uf_especifica?: string | null
          valor?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          automatico?: boolean | null
          codigo?: string
          criado_em?: string | null
          descricao?: string
          id?: number
          id_contrato?: number
          tipo_calculo?: string
          uf_especifica?: string | null
          valor?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_adicionais_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "frt_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_auditoria: {
        Row: {
          chave_cte: string | null
          codigo_cotacao: string | null
          criado_em: string | null
          departamento: string | null
          diferenca_cte_correto: number | null
          diferenca_cte_cotado: number | null
          frete_gratis: boolean | null
          id: number
          id_cotacao: number | null
          id_vendedor: number | null
          nome_vendador: string | null
          nome_vendedor: string | null
          numero_nf: string | null
          obs: string | null
          seguiu_mais_barata: boolean | null
          transportadora: string | null
          transportadora_mais_barata: string | null
          valor_cotado: number | null
          valor_cte: number | null
          valor_deveria_ser: number | null
          valor_mercadoria: number | null
        }
        Insert: {
          chave_cte?: string | null
          codigo_cotacao?: string | null
          criado_em?: string | null
          departamento?: string | null
          diferenca_cte_correto?: number | null
          diferenca_cte_cotado?: number | null
          frete_gratis?: boolean | null
          id?: number
          id_cotacao?: number | null
          id_vendedor?: number | null
          nome_vendador?: string | null
          nome_vendedor?: string | null
          numero_nf?: string | null
          obs?: string | null
          seguiu_mais_barata?: boolean | null
          transportadora?: string | null
          transportadora_mais_barata?: string | null
          valor_cotado?: number | null
          valor_cte?: number | null
          valor_deveria_ser?: number | null
          valor_mercadoria?: number | null
        }
        Update: {
          chave_cte?: string | null
          codigo_cotacao?: string | null
          criado_em?: string | null
          departamento?: string | null
          diferenca_cte_correto?: number | null
          diferenca_cte_cotado?: number | null
          frete_gratis?: boolean | null
          id?: number
          id_cotacao?: number | null
          id_vendedor?: number | null
          nome_vendador?: string | null
          nome_vendedor?: string | null
          numero_nf?: string | null
          obs?: string | null
          seguiu_mais_barata?: boolean | null
          transportadora?: string | null
          transportadora_mais_barata?: string | null
          valor_cotado?: number | null
          valor_cte?: number | null
          valor_deveria_ser?: number | null
          valor_mercadoria?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_auditoria_id_cotacao_fkey"
            columns: ["id_cotacao"]
            isOneToOne: false
            referencedRelation: "frt_cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_catalogo_produtos: {
        Row: {
          altura_cm: number
          ativo: boolean | null
          atualizado_em: string | null
          comprimento_cm: number
          criado_em: string | null
          descricao: string | null
          id: number
          largura_cm: number
          nome: string
          peso_kg: number
          referencia: string | null
          volume_m3: number | null
        }
        Insert: {
          altura_cm: number
          ativo?: boolean | null
          atualizado_em?: string | null
          comprimento_cm: number
          criado_em?: string | null
          descricao?: string | null
          id?: number
          largura_cm: number
          nome: string
          peso_kg: number
          referencia?: string | null
          volume_m3?: number | null
        }
        Update: {
          altura_cm?: number
          ativo?: boolean | null
          atualizado_em?: string | null
          comprimento_cm?: number
          criado_em?: string | null
          descricao?: string | null
          id?: number
          largura_cm?: number
          nome?: string
          peso_kg?: number
          referencia?: string | null
          volume_m3?: number | null
        }
        Relationships: []
      }
      frt_conhecimentos: {
        Row: {
          cep_destino: string | null
          chave_cte: string | null
          cidade_destino: string | null
          cnpj_destinatario: string | null
          cnpj_remetente: string | null
          cnpj_transportadora: string | null
          criado_em: string | null
          data_emissao: string | null
          data_recebimento: string | null
          departamento: string | null
          divergencia: number | null
          email_origem: string | null
          id: number
          id_contrato: number | null
          id_local: number | null
          id_vendedor: number | null
          nome_destinatario: string | null
          nome_transportadora: string | null
          nome_vendedor: string | null
          notas_fiscais: Json | null
          num_cte: string | null
          observacao_auditoria: string | null
          peso_kg: number | null
          serie_cte: string | null
          status_auditoria: string | null
          uf_destino: string | null
          valor_adicionais: number | null
          valor_cotado: number | null
          valor_frete_cte: number | null
          valor_frete_nf: number | null
          valor_gris: number | null
          valor_mercadoria: number | null
          valor_pedagio: number | null
          valor_total_cte: number | null
          xml_raw: string | null
        }
        Insert: {
          cep_destino?: string | null
          chave_cte?: string | null
          cidade_destino?: string | null
          cnpj_destinatario?: string | null
          cnpj_remetente?: string | null
          cnpj_transportadora?: string | null
          criado_em?: string | null
          data_emissao?: string | null
          data_recebimento?: string | null
          departamento?: string | null
          divergencia?: number | null
          email_origem?: string | null
          id?: number
          id_contrato?: number | null
          id_local?: number | null
          id_vendedor?: number | null
          nome_destinatario?: string | null
          nome_transportadora?: string | null
          nome_vendedor?: string | null
          notas_fiscais?: Json | null
          num_cte?: string | null
          observacao_auditoria?: string | null
          peso_kg?: number | null
          serie_cte?: string | null
          status_auditoria?: string | null
          uf_destino?: string | null
          valor_adicionais?: number | null
          valor_cotado?: number | null
          valor_frete_cte?: number | null
          valor_frete_nf?: number | null
          valor_gris?: number | null
          valor_mercadoria?: number | null
          valor_pedagio?: number | null
          valor_total_cte?: number | null
          xml_raw?: string | null
        }
        Update: {
          cep_destino?: string | null
          chave_cte?: string | null
          cidade_destino?: string | null
          cnpj_destinatario?: string | null
          cnpj_remetente?: string | null
          cnpj_transportadora?: string | null
          criado_em?: string | null
          data_emissao?: string | null
          data_recebimento?: string | null
          departamento?: string | null
          divergencia?: number | null
          email_origem?: string | null
          id?: number
          id_contrato?: number | null
          id_local?: number | null
          id_vendedor?: number | null
          nome_destinatario?: string | null
          nome_transportadora?: string | null
          nome_vendedor?: string | null
          notas_fiscais?: Json | null
          num_cte?: string | null
          observacao_auditoria?: string | null
          peso_kg?: number | null
          serie_cte?: string | null
          status_auditoria?: string | null
          uf_destino?: string | null
          valor_adicionais?: number | null
          valor_cotado?: number | null
          valor_frete_cte?: number | null
          valor_frete_nf?: number | null
          valor_gris?: number | null
          valor_mercadoria?: number | null
          valor_pedagio?: number | null
          valor_total_cte?: number | null
          xml_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_conhecimentos_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "frt_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frt_conhecimentos_id_local_fkey"
            columns: ["id_local"]
            isOneToOne: false
            referencedRelation: "frt_locais_expedicao"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_contratos: {
        Row: {
          api_modal: string | null
          api_senha: string | null
          api_tipo_frete: string | null
          api_url_base: string | null
          api_usuario: string | null
          ativo: boolean | null
          criado_em: string | null
          descricao: string | null
          id: number
          id_local: number
          id_transportadora: number
          num_contrato: string | null
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          api_modal?: string | null
          api_senha?: string | null
          api_tipo_frete?: string | null
          api_url_base?: string | null
          api_usuario?: string | null
          ativo?: boolean | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          id_local: number
          id_transportadora: number
          num_contrato?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          api_modal?: string | null
          api_senha?: string | null
          api_tipo_frete?: string | null
          api_url_base?: string | null
          api_usuario?: string | null
          ativo?: boolean | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          id_local?: number
          id_transportadora?: number
          num_contrato?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_contratos_id_local_fkey"
            columns: ["id_local"]
            isOneToOne: false
            referencedRelation: "frt_locais_expedicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frt_contratos_id_transportadora_fkey"
            columns: ["id_transportadora"]
            isOneToOne: false
            referencedRelation: "frt_transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_cotacoes: {
        Row: {
          cep_destino: string
          cidade_destino: string | null
          cnpj_destinatario: string | null
          codigo: string
          criado_em: string | null
          criado_por: string | null
          departamento: string | null
          id: number
          id_cotacao_transp: string | null
          id_local: number | null
          id_vendedor: number | null
          nome_vendedor: string | null
          origem: string | null
          pacotes: Json | null
          peso_cubado_kg: number | null
          peso_taxado: number | null
          peso_total: number | null
          peso_total_kg: number | null
          produtos: Json | null
          qtd_volumes: number | null
          resultados: Json | null
          tipo_destinatario: string | null
          transportadora_escolhida: string | null
          uf_destino: string | null
          valor_escolhido: number | null
          valor_nf: number | null
          volume_total: number | null
          volume_total_m3: number | null
        }
        Insert: {
          cep_destino: string
          cidade_destino?: string | null
          cnpj_destinatario?: string | null
          codigo: string
          criado_em?: string | null
          criado_por?: string | null
          departamento?: string | null
          id?: number
          id_cotacao_transp?: string | null
          id_local?: number | null
          id_vendedor?: number | null
          nome_vendedor?: string | null
          origem?: string | null
          pacotes?: Json | null
          peso_cubado_kg?: number | null
          peso_taxado?: number | null
          peso_total?: number | null
          peso_total_kg?: number | null
          produtos?: Json | null
          qtd_volumes?: number | null
          resultados?: Json | null
          tipo_destinatario?: string | null
          transportadora_escolhida?: string | null
          uf_destino?: string | null
          valor_escolhido?: number | null
          valor_nf?: number | null
          volume_total?: number | null
          volume_total_m3?: number | null
        }
        Update: {
          cep_destino?: string
          cidade_destino?: string | null
          cnpj_destinatario?: string | null
          codigo?: string
          criado_em?: string | null
          criado_por?: string | null
          departamento?: string | null
          id?: number
          id_cotacao_transp?: string | null
          id_local?: number | null
          id_vendedor?: number | null
          nome_vendedor?: string | null
          origem?: string | null
          pacotes?: Json | null
          peso_cubado_kg?: number | null
          peso_taxado?: number | null
          peso_total?: number | null
          peso_total_kg?: number | null
          produtos?: Json | null
          qtd_volumes?: number | null
          resultados?: Json | null
          tipo_destinatario?: string | null
          transportadora_escolhida?: string | null
          uf_destino?: string | null
          valor_escolhido?: number | null
          valor_nf?: number | null
          volume_total?: number | null
          volume_total_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_cotacoes_id_local_fkey"
            columns: ["id_local"]
            isOneToOne: false
            referencedRelation: "frt_locais_expedicao"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_cotacoes_pacotes: {
        Row: {
          altura_cm: number | null
          comprimento_cm: number | null
          descricao: string | null
          id: number
          id_cotacao: number
          id_produto: number | null
          largura_cm: number | null
          peso_kg: number | null
          quantidade: number | null
        }
        Insert: {
          altura_cm?: number | null
          comprimento_cm?: number | null
          descricao?: string | null
          id?: number
          id_cotacao: number
          id_produto?: number | null
          largura_cm?: number | null
          peso_kg?: number | null
          quantidade?: number | null
        }
        Update: {
          altura_cm?: number | null
          comprimento_cm?: number | null
          descricao?: string | null
          id?: number
          id_cotacao?: number
          id_produto?: number | null
          largura_cm?: number | null
          peso_kg?: number | null
          quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_cotacoes_pacotes_id_cotacao_fkey"
            columns: ["id_cotacao"]
            isOneToOne: false
            referencedRelation: "frt_cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_cotacoes_respostas: {
        Row: {
          criado_em: string | null
          detalhes: Json | null
          erro: string | null
          id: number
          id_cotacao: number
          id_cotacao_ext: string | null
          prazo_dias: number | null
          transportadora: string
          valor_frete: number | null
        }
        Insert: {
          criado_em?: string | null
          detalhes?: Json | null
          erro?: string | null
          id?: number
          id_cotacao: number
          id_cotacao_ext?: string | null
          prazo_dias?: number | null
          transportadora: string
          valor_frete?: number | null
        }
        Update: {
          criado_em?: string | null
          detalhes?: Json | null
          erro?: string | null
          id?: number
          id_cotacao?: number
          id_cotacao_ext?: string | null
          prazo_dias?: number | null
          transportadora?: string
          valor_frete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_cotacoes_respostas_id_cotacao_fkey"
            columns: ["id_cotacao"]
            isOneToOne: false
            referencedRelation: "frt_cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_cotacoes_seq: {
        Row: {
          mes_ano: string
          ultimo: number | null
        }
        Insert: {
          mes_ano: string
          ultimo?: number | null
        }
        Update: {
          mes_ano?: string
          ultimo?: number | null
        }
        Relationships: []
      }
      frt_locais_expedicao: {
        Row: {
          ativo: boolean | null
          cep_origem: string
          cidade: string
          criado_em: string | null
          id: number
          nome: string
          uf: string
        }
        Insert: {
          ativo?: boolean | null
          cep_origem: string
          cidade: string
          criado_em?: string | null
          id?: number
          nome: string
          uf: string
        }
        Update: {
          ativo?: boolean | null
          cep_origem?: string
          cidade?: string
          criado_em?: string | null
          id?: number
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      frt_produtos_dimensoes: {
        Row: {
          altura_cm: number | null
          ativo: boolean | null
          atualizado_em: string | null
          comprimento_cm: number | null
          descricao: string | null
          id: number
          id_produto: number
          largura_cm: number | null
          peso_kg: number | null
          referencia: string | null
        }
        Insert: {
          altura_cm?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          comprimento_cm?: number | null
          descricao?: string | null
          id?: number
          id_produto: number
          largura_cm?: number | null
          peso_kg?: number | null
          referencia?: string | null
        }
        Update: {
          altura_cm?: number | null
          ativo?: boolean | null
          atualizado_em?: string | null
          comprimento_cm?: number | null
          descricao?: string | null
          id?: number
          id_produto?: number
          largura_cm?: number | null
          peso_kg?: number | null
          referencia?: string | null
        }
        Relationships: []
      }
      frt_produtos_nf: {
        Row: {
          descricao: string | null
          id_produto: number | null
          referencia: string | null
        }
        Insert: {
          descricao?: string | null
          id_produto?: number | null
          referencia?: string | null
        }
        Update: {
          descricao?: string | null
          id_produto?: number | null
          referencia?: string | null
        }
        Relationships: []
      }
      frt_rastreio: {
        Row: {
          atualizado_em: string | null
          chave_cte: string | null
          chave_nfe: string | null
          cidade_destino: string | null
          cnpj_transportadora: string | null
          criado_em: string | null
          data_emissao: string | null
          data_entrega: string | null
          data_previsao: string | null
          dias_transito: number | null
          empresa: string | null
          entregue: boolean | null
          id: number
          nome_cliente: string | null
          nome_transportadora: string | null
          num_cte: string | null
          num_nf: string | null
          resposta_api: Json | null
          status: string | null
          transportadora_slug: string | null
          uf_destino: string | null
          ultima_ocorrencia: string | null
          ultimo_evento: string | null
        }
        Insert: {
          atualizado_em?: string | null
          chave_cte?: string | null
          chave_nfe?: string | null
          cidade_destino?: string | null
          cnpj_transportadora?: string | null
          criado_em?: string | null
          data_emissao?: string | null
          data_entrega?: string | null
          data_previsao?: string | null
          dias_transito?: number | null
          empresa?: string | null
          entregue?: boolean | null
          id?: number
          nome_cliente?: string | null
          nome_transportadora?: string | null
          num_cte?: string | null
          num_nf?: string | null
          resposta_api?: Json | null
          status?: string | null
          transportadora_slug?: string | null
          uf_destino?: string | null
          ultima_ocorrencia?: string | null
          ultimo_evento?: string | null
        }
        Update: {
          atualizado_em?: string | null
          chave_cte?: string | null
          chave_nfe?: string | null
          cidade_destino?: string | null
          cnpj_transportadora?: string | null
          criado_em?: string | null
          data_emissao?: string | null
          data_entrega?: string | null
          data_previsao?: string | null
          dias_transito?: number | null
          empresa?: string | null
          entregue?: boolean | null
          id?: number
          nome_cliente?: string | null
          nome_transportadora?: string | null
          num_cte?: string | null
          num_nf?: string | null
          resposta_api?: Json | null
          status?: string | null
          transportadora_slug?: string | null
          uf_destino?: string | null
          ultima_ocorrencia?: string | null
          ultimo_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frt_rastreio_chave_cte_fkey"
            columns: ["chave_cte"]
            isOneToOne: true
            referencedRelation: "frt_conhecimentos"
            referencedColumns: ["chave_cte"]
          },
        ]
      }
      frt_rte_cidades: {
        Row: {
          cep: string
          city_id: number
          criado_em: string | null
          descricao: string | null
          uf: string | null
        }
        Insert: {
          cep: string
          city_id: number
          criado_em?: string | null
          descricao?: string | null
          uf?: string | null
        }
        Update: {
          cep?: string
          city_id?: number
          criado_em?: string | null
          descricao?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      frt_rte_malha: {
        Row: {
          atendido: boolean | null
          cep: string
          cidade: string | null
          city_id: number | null
          criado_em: string | null
          uf: string | null
        }
        Insert: {
          atendido?: boolean | null
          cep: string
          cidade?: string | null
          city_id?: number | null
          criado_em?: string | null
          uf?: string | null
        }
        Update: {
          atendido?: boolean | null
          cep?: string
          cidade?: string | null
          city_id?: number | null
          criado_em?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      frt_tabelas_frete: {
        Row: {
          ativo: boolean | null
          cep_fim: string | null
          cep_inicio: string | null
          criado_em: string | null
          cubagem_isenta_m3: number | null
          data_atualizacao: string | null
          data_fim_vigencia: string | null
          data_inicio_vigencia: string | null
          fator_cubagem: number | null
          id: number
          id_contrato: number
          observacao: string | null
          perc_nf: number | null
          regiao_codigo: string
          regiao_praças: string | null
          svd_minimo: number | null
          taxa_minima: number
          uf_destino: string
          valor_kg: number
        }
        Insert: {
          ativo?: boolean | null
          cep_fim?: string | null
          cep_inicio?: string | null
          criado_em?: string | null
          cubagem_isenta_m3?: number | null
          data_atualizacao?: string | null
          data_fim_vigencia?: string | null
          data_inicio_vigencia?: string | null
          fator_cubagem?: number | null
          id?: number
          id_contrato: number
          observacao?: string | null
          perc_nf?: number | null
          regiao_codigo: string
          regiao_praças?: string | null
          svd_minimo?: number | null
          taxa_minima: number
          uf_destino: string
          valor_kg: number
        }
        Update: {
          ativo?: boolean | null
          cep_fim?: string | null
          cep_inicio?: string | null
          criado_em?: string | null
          cubagem_isenta_m3?: number | null
          data_atualizacao?: string | null
          data_fim_vigencia?: string | null
          data_inicio_vigencia?: string | null
          fator_cubagem?: number | null
          id?: number
          id_contrato?: number
          observacao?: string | null
          perc_nf?: number | null
          regiao_codigo?: string
          regiao_praças?: string | null
          svd_minimo?: number | null
          taxa_minima?: number
          uf_destino?: string
          valor_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "frt_tabelas_frete_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "frt_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      frt_transportadoras: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: number
          nome: string
          tipo_integracao: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: number
          nome: string
          tipo_integracao: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: number
          nome?: string
          tipo_integracao?: string
        }
        Relationships: []
      }
      import_pagamentos: {
        Row: {
          cambio: number | null
          criado_em: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          destinatario: string | null
          id: string
          numero_cp: number | null
          observacoes: string | null
          processo_id: string
          status: string
          tipo: string
          valor_brl: number | null
          valor_rateado_brl: number | null
          valor_usd: number | null
        }
        Insert: {
          cambio?: number | null
          criado_em?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          destinatario?: string | null
          id?: string
          numero_cp?: number | null
          observacoes?: string | null
          processo_id: string
          status?: string
          tipo?: string
          valor_brl?: number | null
          valor_rateado_brl?: number | null
          valor_usd?: number | null
        }
        Update: {
          cambio?: number | null
          criado_em?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          destinatario?: string | null
          id?: string
          numero_cp?: number | null
          observacoes?: string | null
          processo_id?: string
          status?: string
          tipo?: string
          valor_brl?: number | null
          valor_rateado_brl?: number | null
          valor_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_pagamentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "import_processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_pagamentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_import_processos_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      import_pedidos: {
        Row: {
          criado_em: string | null
          id: string
          numero_pedido: number
          observacao: string | null
          processo_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          numero_pedido: number
          observacao?: string | null
          processo_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          numero_pedido?: number
          observacao?: string | null
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_pedidos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "import_processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_pedidos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_import_processos_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      import_processos: {
        Row: {
          atualizado_em: string | null
          codigo: string
          criado_em: string | null
          criado_por: string | null
          data_chegada_real: string | null
          data_embarque: string | null
          data_prev_chegada: string | null
          id: string
          id_fornecedor: number | null
          importadora: string | null
          nome_fornecedor: string | null
          observacoes: string | null
          status: string
          status_pgto: string | null
          valor_total_brl: number | null
          valor_total_usd: number | null
        }
        Insert: {
          atualizado_em?: string | null
          codigo: string
          criado_em?: string | null
          criado_por?: string | null
          data_chegada_real?: string | null
          data_embarque?: string | null
          data_prev_chegada?: string | null
          id?: string
          id_fornecedor?: number | null
          importadora?: string | null
          nome_fornecedor?: string | null
          observacoes?: string | null
          status?: string
          status_pgto?: string | null
          valor_total_brl?: number | null
          valor_total_usd?: number | null
        }
        Update: {
          atualizado_em?: string | null
          codigo?: string
          criado_em?: string | null
          criado_por?: string | null
          data_chegada_real?: string | null
          data_embarque?: string | null
          data_prev_chegada?: string | null
          id?: string
          id_fornecedor?: number | null
          importadora?: string | null
          nome_fornecedor?: string | null
          observacoes?: string | null
          status?: string
          status_pgto?: string | null
          valor_total_brl?: number | null
          valor_total_usd?: number | null
        }
        Relationships: []
      }
      os_data_fat_lock: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data_faturamento_atual: string | null
          data_faturamento_original: string
          id_os: number
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_faturamento_atual?: string | null
          data_faturamento_original: string
          id_os: number
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_faturamento_atual?: string | null
          data_faturamento_original?: string
          id_os?: number
        }
        Relationships: []
      }
      sync_control: {
        Row: {
          last_sync_at: string | null
          state: Json
          total_synced: number | null
          view_name: string
        }
        Insert: {
          last_sync_at?: string | null
          state?: Json
          total_synced?: number | null
          view_name: string
        }
        Update: {
          last_sync_at?: string | null
          state?: Json
          total_synced?: number | null
          view_name?: string
        }
        Relationships: []
      }
      vw_comercial_docs_faturados: {
        Row: {
          chave_nfe: string | null
          cubagem: number | null
          custo_doc: number | null
          data_faturamento: string | null
          empresa: string | null
          faturamento_doc: number | null
          faturamento_liquido: number | null
          frete_por_conta: string | null
          id: number
          id_cliente: number | null
          id_doc: number | null
          id_empresa: number | null
          id_tipo_saida: number | null
          id_transportadora: number | null
          id_vendedor: number | null
          linhas_itens_doc: number | null
          margem_doc: number | null
          margem_liquida: number | null
          nome_cliente: string | null
          nome_transportadora: string | null
          nome_vendedor: string | null
          num_nf: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          qtd_itens_doc: number | null
          taxa_marketplace: number | null
          tipo_doc: string | null
          tipo_saida: string | null
          valor_frete: number | null
          valor_outras_desp: number | null
          valor_seguro: number | null
        }
        Insert: {
          chave_nfe?: string | null
          cubagem?: number | null
          custo_doc?: number | null
          data_faturamento?: string | null
          empresa?: string | null
          faturamento_doc?: number | null
          faturamento_liquido?: number | null
          frete_por_conta?: string | null
          id?: number
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_tipo_saida?: number | null
          id_transportadora?: number | null
          id_vendedor?: number | null
          linhas_itens_doc?: number | null
          margem_doc?: number | null
          margem_liquida?: number | null
          nome_cliente?: string | null
          nome_transportadora?: string | null
          nome_vendedor?: string | null
          num_nf?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          qtd_itens_doc?: number | null
          taxa_marketplace?: number | null
          tipo_doc?: string | null
          tipo_saida?: string | null
          valor_frete?: number | null
          valor_outras_desp?: number | null
          valor_seguro?: number | null
        }
        Update: {
          chave_nfe?: string | null
          cubagem?: number | null
          custo_doc?: number | null
          data_faturamento?: string | null
          empresa?: string | null
          faturamento_doc?: number | null
          faturamento_liquido?: number | null
          frete_por_conta?: string | null
          id?: number
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_tipo_saida?: number | null
          id_transportadora?: number | null
          id_vendedor?: number | null
          linhas_itens_doc?: number | null
          margem_doc?: number | null
          margem_liquida?: number | null
          nome_cliente?: string | null
          nome_transportadora?: string | null
          nome_vendedor?: string | null
          num_nf?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          qtd_itens_doc?: number | null
          taxa_marketplace?: number | null
          tipo_doc?: string | null
          tipo_saida?: string | null
          valor_frete?: number | null
          valor_outras_desp?: number | null
          valor_seguro?: number | null
        }
        Relationships: []
      }
      vw_comercial_itens_faturados: {
        Row: {
          custo_total: number | null
          custo_unit: number | null
          data_criacao: string | null
          data_doc: string | null
          data_faturamento: string | null
          empresa: string | null
          grupo: string | null
          id: number
          id_categoria: number | null
          id_cliente: number | null
          id_doc: number | null
          id_empresa: number | null
          id_grupo: number | null
          id_item: number | null
          id_produto: number | null
          id_subgrupo: number | null
          id_tipo_saida: number | null
          id_vendedor: number | null
          margem_item: number | null
          produto: string | null
          qtd: number | null
          referencia: string | null
          situacao_produto: string | null
          subgrupo: string | null
          tipo_doc: string | null
          tipo_produto: string | null
          tipo_saida: string | null
          total_item: number | null
          vl_desc: number | null
          vl_unit: number | null
        }
        Insert: {
          custo_total?: number | null
          custo_unit?: number | null
          data_criacao?: string | null
          data_doc?: string | null
          data_faturamento?: string | null
          empresa?: string | null
          grupo?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item?: number | null
          id_produto?: number | null
          id_subgrupo?: number | null
          id_tipo_saida?: number | null
          id_vendedor?: number | null
          margem_item?: number | null
          produto?: string | null
          qtd?: number | null
          referencia?: string | null
          situacao_produto?: string | null
          subgrupo?: string | null
          tipo_doc?: string | null
          tipo_produto?: string | null
          tipo_saida?: string | null
          total_item?: number | null
          vl_desc?: number | null
          vl_unit?: number | null
        }
        Update: {
          custo_total?: number | null
          custo_unit?: number | null
          data_criacao?: string | null
          data_doc?: string | null
          data_faturamento?: string | null
          empresa?: string | null
          grupo?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item?: number | null
          id_produto?: number | null
          id_subgrupo?: number | null
          id_tipo_saida?: number | null
          id_vendedor?: number | null
          margem_item?: number | null
          produto?: string | null
          qtd?: number | null
          referencia?: string | null
          situacao_produto?: string | null
          subgrupo?: string | null
          tipo_doc?: string | null
          tipo_produto?: string | null
          tipo_saida?: string | null
          total_item?: number | null
          vl_desc?: number | null
          vl_unit?: number | null
        }
        Relationships: []
      }
      vw_dim_cliente: {
        Row: {
          bairro: string | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato: string | null
          cpf: string | null
          email: string | null
          endereco: string | null
          id: number
          id_categoria: number | null
          id_cliente: number | null
          latitude: string | null
          longitude: string | null
          nome_cliente: string | null
          situacao: string | null
          telefone1: string | null
          telefone2: string | null
          telefone3: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          cpf?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          latitude?: string | null
          longitude?: string | null
          nome_cliente?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          cpf?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          latitude?: string | null
          longitude?: string | null
          nome_cliente?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      vw_dim_colaborador: {
        Row: {
          cargo: string | null
          data_admissao: string | null
          data_demissao: string | null
          departamento: string | null
          email: string | null
          horas_diarias: string | null
          id: number
          id_cargo: number | null
          id_colaborador: number | null
          id_departamento: number | null
          id_empresa: number | null
          matricula: string | null
          nome_colaborador: string | null
          perc_comissao_prod: number | null
          perc_comissao_serv: number | null
          salario: number | null
          situacao: string | null
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          departamento?: string | null
          email?: string | null
          horas_diarias?: string | null
          id?: never
          id_cargo?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          matricula?: string | null
          nome_colaborador?: string | null
          perc_comissao_prod?: number | null
          perc_comissao_serv?: number | null
          salario?: number | null
          situacao?: string | null
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          departamento?: string | null
          email?: string | null
          horas_diarias?: string | null
          id?: never
          id_cargo?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          matricula?: string | null
          nome_colaborador?: string | null
          perc_comissao_prod?: number | null
          perc_comissao_serv?: number | null
          salario?: number | null
          situacao?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      vw_dim_vendedor: {
        Row: {
          departamento: string | null
          id: number
          id_departamento: number | null
          id_empresa: number | null
          id_vendedor: number | null
          nome_vendedor: string | null
        }
        Insert: {
          departamento?: string | null
          id?: number
          id_departamento?: number | null
          id_empresa?: number | null
          id_vendedor?: number | null
          nome_vendedor?: string | null
        }
        Update: {
          departamento?: string | null
          id?: number
          id_departamento?: number | null
          id_empresa?: number | null
          id_vendedor?: number | null
          nome_vendedor?: string | null
        }
        Relationships: []
      }
      vw_fb_centro_custo: {
        Row: {
          ativo: string | null
          chdados: number | null
          codigo: number | null
          descricao: string | null
          id: number
        }
        Insert: {
          ativo?: string | null
          chdados?: number | null
          codigo?: number | null
          descricao?: string | null
          id?: never
        }
        Update: {
          ativo?: string | null
          chdados?: number | null
          codigo?: number | null
          descricao?: string | null
          id?: never
        }
        Relationships: []
      }
      vw_fb_centro_custo_mov: {
        Row: {
          chcentro_custo: number | null
          chcod_movimento: number | null
          chcod_responsavel: number | null
          codigo: number | null
          id: number
          percent_participacao: number | null
          valor: number | null
        }
        Insert: {
          chcentro_custo?: number | null
          chcod_movimento?: number | null
          chcod_responsavel?: number | null
          codigo?: number | null
          id?: never
          percent_participacao?: number | null
          valor?: number | null
        }
        Update: {
          chcentro_custo?: number | null
          chcod_movimento?: number | null
          chcod_responsavel?: number | null
          codigo?: number | null
          id?: never
          percent_participacao?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      vw_fb_contas_fin: {
        Row: {
          chdados: number | null
          chorigem: string | null
          chorigen: number | null
          cod_contas_fin: number | null
          data_bloq_exercicio: string | null
          descricao: string | null
          exclusao: string | null
          id: number
          num_agencia: string | null
          num_conta: string | null
          outros: string | null
          saldo: number | null
          tipo: string | null
        }
        Insert: {
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          cod_contas_fin?: number | null
          data_bloq_exercicio?: string | null
          descricao?: string | null
          exclusao?: string | null
          id?: number
          num_agencia?: string | null
          num_conta?: string | null
          outros?: string | null
          saldo?: number | null
          tipo?: string | null
        }
        Update: {
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          cod_contas_fin?: number | null
          data_bloq_exercicio?: string | null
          descricao?: string | null
          exclusao?: string | null
          id?: number
          num_agencia?: string | null
          num_conta?: string | null
          outros?: string | null
          saldo?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_fb_contas_resultado: {
        Row: {
          ch_cod_grupo_rd: number | null
          chdados: number | null
          chorigem: string | null
          chorigen: number | null
          chsubgrupo_rd: number | null
          cod_conta: number | null
          contab_comissao: string | null
          descricao: string | null
          entra_demonst: string | null
          exclusao: string | null
          fixo: string | null
          id: number
          id_contabil: string | null
          id_legado: number | null
          id_pesquisa: string | null
          primeira_parc: string | null
        }
        Insert: {
          ch_cod_grupo_rd?: number | null
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          chsubgrupo_rd?: number | null
          cod_conta?: number | null
          contab_comissao?: string | null
          descricao?: string | null
          entra_demonst?: string | null
          exclusao?: string | null
          fixo?: string | null
          id?: number
          id_contabil?: string | null
          id_legado?: number | null
          id_pesquisa?: string | null
          primeira_parc?: string | null
        }
        Update: {
          ch_cod_grupo_rd?: number | null
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          chsubgrupo_rd?: number | null
          cod_conta?: number | null
          contab_comissao?: string | null
          descricao?: string | null
          entra_demonst?: string | null
          exclusao?: string | null
          fixo?: string | null
          id?: number
          id_contabil?: string | null
          id_legado?: number | null
          id_pesquisa?: string | null
          primeira_parc?: string | null
        }
        Relationships: []
      }
      vw_fb_contatos: {
        Row: {
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          email: string | null
          id: number
          id_contato: number | null
          latitude: string | null
          longitude: string | null
          nome_contato: string | null
          situacao: string | null
          telefone1: string | null
          telefone2: string | null
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          id?: never
          id_contato?: number | null
          latitude?: string | null
          longitude?: string | null
          nome_contato?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          id?: never
          id_contato?: number | null
          latitude?: string | null
          longitude?: string | null
          nome_contato?: string | null
          situacao?: string | null
          telefone1?: string | null
          telefone2?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      vw_fb_estoque_centro: {
        Row: {
          centro_estoque: string | null
          centro_padrao: string | null
          centro_situacao: string | null
          custo_real: number | null
          empresa: string | null
          estoque: number | null
          grupo: string | null
          id: number
          id_centro_estoque: number
          id_empresa: number
          id_grupo: number | null
          id_produto: number
          id_subgrupo: number | null
          nome: string | null
          preco_compra: number | null
          preco_compra_medio: number | null
          referencia: string | null
          sincronizado_em: string | null
          subgrupo: string | null
        }
        Insert: {
          centro_estoque?: string | null
          centro_padrao?: string | null
          centro_situacao?: string | null
          custo_real?: number | null
          empresa?: string | null
          estoque?: number | null
          grupo?: string | null
          id?: number
          id_centro_estoque: number
          id_empresa: number
          id_grupo?: number | null
          id_produto: number
          id_subgrupo?: number | null
          nome?: string | null
          preco_compra?: number | null
          preco_compra_medio?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          subgrupo?: string | null
        }
        Update: {
          centro_estoque?: string | null
          centro_padrao?: string | null
          centro_situacao?: string | null
          custo_real?: number | null
          empresa?: string | null
          estoque?: number | null
          grupo?: string | null
          id?: number
          id_centro_estoque?: number
          id_empresa?: number
          id_grupo?: number | null
          id_produto?: number
          id_subgrupo?: number | null
          nome?: string | null
          preco_compra?: number | null
          preco_compra_medio?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          subgrupo?: string | null
        }
        Relationships: []
      }
      vw_fb_forn_prod: {
        Row: {
          cnpj_fornecedor: string | null
          id: number
          id_forn_prod: number
          id_fornecedor: number
          id_produto: number
          nome_fornecedor: string | null
          nome_produto: string | null
          preco_fornecedor: number | null
          referencia_fornecedor: string | null
          referencia_produto: string | null
          sincronizado_em: string | null
        }
        Insert: {
          cnpj_fornecedor?: string | null
          id?: number
          id_forn_prod: number
          id_fornecedor: number
          id_produto: number
          nome_fornecedor?: string | null
          nome_produto?: string | null
          preco_fornecedor?: number | null
          referencia_fornecedor?: string | null
          referencia_produto?: string | null
          sincronizado_em?: string | null
        }
        Update: {
          cnpj_fornecedor?: string | null
          id?: number
          id_forn_prod?: number
          id_fornecedor?: number
          id_produto?: number
          nome_fornecedor?: string | null
          nome_produto?: string | null
          preco_fornecedor?: number | null
          referencia_fornecedor?: string | null
          referencia_produto?: string | null
          sincronizado_em?: string | null
        }
        Relationships: []
      }
      vw_fb_grupo_rd: {
        Row: {
          ativo: string | null
          chdados: number | null
          chorigem: string | null
          chorigen: number | null
          cod_grupo_rd: number | null
          descricao: string | null
          fixo: string | null
          id: number
          id_legado: number | null
          tipo: string | null
          tipo_despesa: string | null
        }
        Insert: {
          ativo?: string | null
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          cod_grupo_rd?: number | null
          descricao?: string | null
          fixo?: string | null
          id?: number
          id_legado?: number | null
          tipo?: string | null
          tipo_despesa?: string | null
        }
        Update: {
          ativo?: string | null
          chdados?: number | null
          chorigem?: string | null
          chorigen?: number | null
          cod_grupo_rd?: number | null
          descricao?: string | null
          fixo?: string | null
          id?: number
          id_legado?: number | null
          tipo?: string | null
          tipo_despesa?: string | null
        }
        Relationships: []
      }
      vw_fb_historico_compras: {
        Row: {
          cfop: string | null
          data_compra: string | null
          data_recebimento: string | null
          desconto: number | null
          empresa: string | null
          frete_prop: number | null
          grupo: string | null
          hab_mov_financeiro: string | null
          id: number
          id_compra: number
          id_empresa: number | null
          id_fornecedor: number | null
          id_grupo: number | null
          id_item_compra: number
          id_produto: number
          id_subgrupo: number | null
          id_venda_origem: number | null
          lead_time_dias: number | null
          mov_estoque: string | null
          nome_fornecedor: string | null
          nome_produto: string | null
          num_nf: string | null
          outras_prop: number | null
          qtd: number | null
          referencia: string | null
          seguro_prop: number | null
          sincronizado_em: string | null
          status_compra: string | null
          subgrupo: string | null
          tipo_entrada: string | null
          valor_ipi: number | null
          valor_total: number | null
          vl_unit: number | null
        }
        Insert: {
          cfop?: string | null
          data_compra?: string | null
          data_recebimento?: string | null
          desconto?: number | null
          empresa?: string | null
          frete_prop?: number | null
          grupo?: string | null
          hab_mov_financeiro?: string | null
          id?: number
          id_compra: number
          id_empresa?: number | null
          id_fornecedor?: number | null
          id_grupo?: number | null
          id_item_compra: number
          id_produto: number
          id_subgrupo?: number | null
          id_venda_origem?: number | null
          lead_time_dias?: number | null
          mov_estoque?: string | null
          nome_fornecedor?: string | null
          nome_produto?: string | null
          num_nf?: string | null
          outras_prop?: number | null
          qtd?: number | null
          referencia?: string | null
          seguro_prop?: number | null
          sincronizado_em?: string | null
          status_compra?: string | null
          subgrupo?: string | null
          tipo_entrada?: string | null
          valor_ipi?: number | null
          valor_total?: number | null
          vl_unit?: number | null
        }
        Update: {
          cfop?: string | null
          data_compra?: string | null
          data_recebimento?: string | null
          desconto?: number | null
          empresa?: string | null
          frete_prop?: number | null
          grupo?: string | null
          hab_mov_financeiro?: string | null
          id?: number
          id_compra?: number
          id_empresa?: number | null
          id_fornecedor?: number | null
          id_grupo?: number | null
          id_item_compra?: number
          id_produto?: number
          id_subgrupo?: number | null
          id_venda_origem?: number | null
          lead_time_dias?: number | null
          mov_estoque?: string | null
          nome_fornecedor?: string | null
          nome_produto?: string | null
          num_nf?: string | null
          outras_prop?: number | null
          qtd?: number | null
          referencia?: string | null
          seguro_prop?: number | null
          sincronizado_em?: string | null
          status_compra?: string | null
          subgrupo?: string | null
          tipo_entrada?: string | null
          valor_ipi?: number | null
          valor_total?: number | null
          vl_unit?: number | null
        }
        Relationships: []
      }
      vw_fb_mov_estoque: {
        Row: {
          cancelada: string | null
          centro_estoque: string | null
          custo_unit: number | null
          data_cancelamento: string | null
          data_mov: string | null
          empresa: string | null
          grupo: string | null
          hora_mov: string | null
          id: number
          id_centro_estoque: number | null
          id_consumo: number | null
          id_empresa: number | null
          id_grupo: number | null
          id_item_mov: number
          id_mov: number
          id_os: number | null
          id_produto: number
          id_subgrupo: number | null
          id_unidade: number | null
          id_venda: number | null
          motivo: string | null
          nome_produto: string | null
          qtd: number | null
          referencia: string | null
          sincronizado_em: string | null
          status_mov: string | null
          subgrupo: string | null
          tipo_es: string | null
          tipo_mov: string | null
          unidade: string | null
        }
        Insert: {
          cancelada?: string | null
          centro_estoque?: string | null
          custo_unit?: number | null
          data_cancelamento?: string | null
          data_mov?: string | null
          empresa?: string | null
          grupo?: string | null
          hora_mov?: string | null
          id?: number
          id_centro_estoque?: number | null
          id_consumo?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item_mov: number
          id_mov: number
          id_os?: number | null
          id_produto: number
          id_subgrupo?: number | null
          id_unidade?: number | null
          id_venda?: number | null
          motivo?: string | null
          nome_produto?: string | null
          qtd?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          status_mov?: string | null
          subgrupo?: string | null
          tipo_es?: string | null
          tipo_mov?: string | null
          unidade?: string | null
        }
        Update: {
          cancelada?: string | null
          centro_estoque?: string | null
          custo_unit?: number | null
          data_cancelamento?: string | null
          data_mov?: string | null
          empresa?: string | null
          grupo?: string | null
          hora_mov?: string | null
          id?: number
          id_centro_estoque?: number | null
          id_consumo?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item_mov?: number
          id_mov?: number
          id_os?: number | null
          id_produto?: number
          id_subgrupo?: number | null
          id_unidade?: number | null
          id_venda?: number | null
          motivo?: string | null
          nome_produto?: string | null
          qtd?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          status_mov?: string | null
          subgrupo?: string | null
          tipo_es?: string | null
          tipo_mov?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      vw_fb_mov_grupo_rd: {
        Row: {
          baixa: string | null
          ch_cod_conta: number | null
          ch_cod_contato: number | null
          ch_cod_grupo_rd: number | null
          ch_cod_tipo_fatura: number | null
          chdados: number | null
          chsubgrupo_rd: number | null
          cod_movimento: number | null
          data_competencia: string | null
          desc_conta: string | null
          desc_grupo_rd: string | null
          desc_subgrupo_rd: string | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          entra_demonst: string | null
          historico: string | null
          id: number
          modalidade: string | null
          mult_valor: number | null
          num_doc: string | null
          tipo_dc: string | null
          tipo_despesa: string | null
          tipo_grupo: string | null
          valor_item: number | null
          valor_total: number | null
        }
        Insert: {
          baixa?: string | null
          ch_cod_conta?: number | null
          ch_cod_contato?: number | null
          ch_cod_grupo_rd?: number | null
          ch_cod_tipo_fatura?: number | null
          chdados?: number | null
          chsubgrupo_rd?: number | null
          cod_movimento?: number | null
          data_competencia?: string | null
          desc_conta?: string | null
          desc_grupo_rd?: string | null
          desc_subgrupo_rd?: string | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          entra_demonst?: string | null
          historico?: string | null
          id?: number
          modalidade?: string | null
          mult_valor?: number | null
          num_doc?: string | null
          tipo_dc?: string | null
          tipo_despesa?: string | null
          tipo_grupo?: string | null
          valor_item?: number | null
          valor_total?: number | null
        }
        Update: {
          baixa?: string | null
          ch_cod_conta?: number | null
          ch_cod_contato?: number | null
          ch_cod_grupo_rd?: number | null
          ch_cod_tipo_fatura?: number | null
          chdados?: number | null
          chsubgrupo_rd?: number | null
          cod_movimento?: number | null
          data_competencia?: string | null
          desc_conta?: string | null
          desc_grupo_rd?: string | null
          desc_subgrupo_rd?: string | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          entra_demonst?: string | null
          historico?: string | null
          id?: number
          modalidade?: string | null
          mult_valor?: number | null
          num_doc?: string | null
          tipo_dc?: string | null
          tipo_despesa?: string | null
          tipo_grupo?: string | null
          valor_item?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      vw_fb_movimento_base: {
        Row: {
          aprov_pag: string | null
          baixa: string | null
          ch_cod_condpag: number | null
          ch_cod_conta_fin: number | null
          ch_cod_contato: number | null
          ch_cod_tipo_fatura: number | null
          ch_cod_usuario: number | null
          ch_cod_usuario_baixa: number | null
          ch_mov_parc1: number | null
          ch_origem: number | null
          chconciliacao: number | null
          chdados: number | null
          chforma_pag: number | null
          chorigem: string | null
          chorigen: number | null
          chusuario_aprov_pag: number | null
          cobranca_enviada: string | null
          cod_movimento: number | null
          custodia: string | null
          d_mais: number | null
          data_competencia: string | null
          dt_acao_baixa: string | null
          dt_aprov_pag: string | null
          dt_baixa: string | null
          dt_cadastro: string | null
          dt_custodia: string | null
          dt_exclusao: string | null
          dt_exclusao_serasa: string | null
          dt_faturamento: string | null
          dt_flutuante: string | null
          dt_inclusao_serasa: string | null
          dt_repasse_pag: string | null
          dt_vencimento: string | null
          exclusao: string | null
          historico: string | null
          id: number
          id_integracao: number | null
          libera_uso_saldo: string | null
          modalidade: string | null
          num_doc: string | null
          num_operacao_baixa: number | null
          origem: number | null
          parcela: number | null
          prioridade: string | null
          tem_anexo: string | null
          tipo_dc: string | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Insert: {
          aprov_pag?: string | null
          baixa?: string | null
          ch_cod_condpag?: number | null
          ch_cod_conta_fin?: number | null
          ch_cod_contato?: number | null
          ch_cod_tipo_fatura?: number | null
          ch_cod_usuario?: number | null
          ch_cod_usuario_baixa?: number | null
          ch_mov_parc1?: number | null
          ch_origem?: number | null
          chconciliacao?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          chorigem?: string | null
          chorigen?: number | null
          chusuario_aprov_pag?: number | null
          cobranca_enviada?: string | null
          cod_movimento?: number | null
          custodia?: string | null
          d_mais?: number | null
          data_competencia?: string | null
          dt_acao_baixa?: string | null
          dt_aprov_pag?: string | null
          dt_baixa?: string | null
          dt_cadastro?: string | null
          dt_custodia?: string | null
          dt_exclusao?: string | null
          dt_exclusao_serasa?: string | null
          dt_faturamento?: string | null
          dt_flutuante?: string | null
          dt_inclusao_serasa?: string | null
          dt_repasse_pag?: string | null
          dt_vencimento?: string | null
          exclusao?: string | null
          historico?: string | null
          id?: number
          id_integracao?: number | null
          libera_uso_saldo?: string | null
          modalidade?: string | null
          num_doc?: string | null
          num_operacao_baixa?: number | null
          origem?: number | null
          parcela?: number | null
          prioridade?: string | null
          tem_anexo?: string | null
          tipo_dc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Update: {
          aprov_pag?: string | null
          baixa?: string | null
          ch_cod_condpag?: number | null
          ch_cod_conta_fin?: number | null
          ch_cod_contato?: number | null
          ch_cod_tipo_fatura?: number | null
          ch_cod_usuario?: number | null
          ch_cod_usuario_baixa?: number | null
          ch_mov_parc1?: number | null
          ch_origem?: number | null
          chconciliacao?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          chorigem?: string | null
          chorigen?: number | null
          chusuario_aprov_pag?: number | null
          cobranca_enviada?: string | null
          cod_movimento?: number | null
          custodia?: string | null
          d_mais?: number | null
          data_competencia?: string | null
          dt_acao_baixa?: string | null
          dt_aprov_pag?: string | null
          dt_baixa?: string | null
          dt_cadastro?: string | null
          dt_custodia?: string | null
          dt_exclusao?: string | null
          dt_exclusao_serasa?: string | null
          dt_faturamento?: string | null
          dt_flutuante?: string | null
          dt_inclusao_serasa?: string | null
          dt_repasse_pag?: string | null
          dt_vencimento?: string | null
          exclusao?: string | null
          historico?: string | null
          id?: number
          id_integracao?: number | null
          libera_uso_saldo?: string | null
          modalidade?: string | null
          num_doc?: string | null
          num_operacao_baixa?: number | null
          origem?: number | null
          parcela?: number | null
          prioridade?: string | null
          tem_anexo?: string | null
          tipo_dc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Relationships: []
      }
      vw_fb_pedidos_compra: {
        Row: {
          data_pedido: string | null
          data_prev_recebimento: string | null
          empresa: string | null
          especificacao: string | null
          gerou_nf: string | null
          grupo: string | null
          id: number
          id_empresa: number | null
          id_fornecedor: number | null
          id_grupo: number | null
          id_item_pedido: number
          id_pedido: number
          id_produto: number
          id_subgrupo: number | null
          item_finalizado: string | null
          nome_fornecedor: string | null
          nome_produto: string | null
          pedido_cancelado: string | null
          qtd_solicitada: number | null
          referencia: string | null
          sincronizado_em: string | null
          status_pedido: string | null
          subgrupo: string | null
          vl_desc: number | null
          vl_frete: number | null
          vl_icms_st: number | null
          vl_ipi: number | null
          vl_outras: number | null
          vl_unit: number | null
        }
        Insert: {
          data_pedido?: string | null
          data_prev_recebimento?: string | null
          empresa?: string | null
          especificacao?: string | null
          gerou_nf?: string | null
          grupo?: string | null
          id?: number
          id_empresa?: number | null
          id_fornecedor?: number | null
          id_grupo?: number | null
          id_item_pedido: number
          id_pedido: number
          id_produto: number
          id_subgrupo?: number | null
          item_finalizado?: string | null
          nome_fornecedor?: string | null
          nome_produto?: string | null
          pedido_cancelado?: string | null
          qtd_solicitada?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          status_pedido?: string | null
          subgrupo?: string | null
          vl_desc?: number | null
          vl_frete?: number | null
          vl_icms_st?: number | null
          vl_ipi?: number | null
          vl_outras?: number | null
          vl_unit?: number | null
        }
        Update: {
          data_pedido?: string | null
          data_prev_recebimento?: string | null
          empresa?: string | null
          especificacao?: string | null
          gerou_nf?: string | null
          grupo?: string | null
          id?: number
          id_empresa?: number | null
          id_fornecedor?: number | null
          id_grupo?: number | null
          id_item_pedido?: number
          id_pedido?: number
          id_produto?: number
          id_subgrupo?: number | null
          item_finalizado?: string | null
          nome_fornecedor?: string | null
          nome_produto?: string | null
          pedido_cancelado?: string | null
          qtd_solicitada?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          status_pedido?: string | null
          subgrupo?: string | null
          vl_desc?: number | null
          vl_frete?: number | null
          vl_icms_st?: number | null
          vl_ipi?: number | null
          vl_outras?: number | null
          vl_unit?: number | null
        }
        Relationships: []
      }
      vw_fb_produtos_compras: {
        Row: {
          codbarra: string | null
          complemento: string | null
          curva_abc_qtd: string | null
          curva_abc_valor: string | null
          custo_real: number | null
          dt_atualizacao: string | null
          dt_atualizacao_preco: string | null
          dt_curva_abc: string | null
          dt_mov_estoque: string | null
          dt_ultima_compra: string | null
          dt_ultima_venda: string | null
          empresa: string | null
          estoque_fisico: number | null
          estoque_maximo: number | null
          estoque_minimo: number | null
          estoque_reserva: number | null
          fora_linha: string | null
          grupo: string | null
          id: number
          id_empresa: number
          id_grupo: number | null
          id_produto: number
          id_subgrupo: number | null
          id_unidade: number | null
          localizacao: string | null
          nome: string
          nome_ecomerce: string | null
          preco_atacado: number | null
          preco_aux1: number | null
          preco_aux2: number | null
          preco_aux3: number | null
          preco_compra: number | null
          preco_compra_medio: number | null
          preco_compra_ponderado: number | null
          preco_venda: number | null
          referencia: string | null
          sincronizado_em: string | null
          situacao: string | null
          subgrupo: string | null
          tipo: string | null
          unidade: string | null
          unidade_sigla: string | null
        }
        Insert: {
          codbarra?: string | null
          complemento?: string | null
          curva_abc_qtd?: string | null
          curva_abc_valor?: string | null
          custo_real?: number | null
          dt_atualizacao?: string | null
          dt_atualizacao_preco?: string | null
          dt_curva_abc?: string | null
          dt_mov_estoque?: string | null
          dt_ultima_compra?: string | null
          dt_ultima_venda?: string | null
          empresa?: string | null
          estoque_fisico?: number | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          estoque_reserva?: number | null
          fora_linha?: string | null
          grupo?: string | null
          id?: number
          id_empresa: number
          id_grupo?: number | null
          id_produto: number
          id_subgrupo?: number | null
          id_unidade?: number | null
          localizacao?: string | null
          nome: string
          nome_ecomerce?: string | null
          preco_atacado?: number | null
          preco_aux1?: number | null
          preco_aux2?: number | null
          preco_aux3?: number | null
          preco_compra?: number | null
          preco_compra_medio?: number | null
          preco_compra_ponderado?: number | null
          preco_venda?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          situacao?: string | null
          subgrupo?: string | null
          tipo?: string | null
          unidade?: string | null
          unidade_sigla?: string | null
        }
        Update: {
          codbarra?: string | null
          complemento?: string | null
          curva_abc_qtd?: string | null
          curva_abc_valor?: string | null
          custo_real?: number | null
          dt_atualizacao?: string | null
          dt_atualizacao_preco?: string | null
          dt_curva_abc?: string | null
          dt_mov_estoque?: string | null
          dt_ultima_compra?: string | null
          dt_ultima_venda?: string | null
          empresa?: string | null
          estoque_fisico?: number | null
          estoque_maximo?: number | null
          estoque_minimo?: number | null
          estoque_reserva?: number | null
          fora_linha?: string | null
          grupo?: string | null
          id?: number
          id_empresa?: number
          id_grupo?: number | null
          id_produto?: number
          id_subgrupo?: number | null
          id_unidade?: number | null
          localizacao?: string | null
          nome?: string
          nome_ecomerce?: string | null
          preco_atacado?: number | null
          preco_aux1?: number | null
          preco_aux2?: number | null
          preco_aux3?: number | null
          preco_compra?: number | null
          preco_compra_medio?: number | null
          preco_compra_ponderado?: number | null
          preco_venda?: number | null
          referencia?: string | null
          sincronizado_em?: string | null
          situacao?: string | null
          subgrupo?: string | null
          tipo?: string | null
          unidade?: string | null
          unidade_sigla?: string | null
        }
        Relationships: []
      }
      vw_fb_subgrupo_rd: {
        Row: {
          ativo: string | null
          chdados: number | null
          codigo: number | null
          descricao: string | null
          id: number
          id_legado: number | null
        }
        Insert: {
          ativo?: string | null
          chdados?: number | null
          codigo?: number | null
          descricao?: string | null
          id?: number
          id_legado?: number | null
        }
        Update: {
          ativo?: string | null
          chdados?: number | null
          codigo?: number | null
          descricao?: string | null
          id?: number
          id_legado?: number | null
        }
        Relationships: []
      }
      vw_fin_cc_desp: {
        Row: {
          data_competencia: string | null
          descricao_cc: string | null
          id: number
          id_centro_custo: number | null
          id_empresa_cc: number | null
          qtd_docs: number | null
          tipo_dc: string | null
          total_pago_rateado: number | null
          total_rateado: number | null
        }
        Insert: {
          data_competencia?: string | null
          descricao_cc?: string | null
          id?: never
          id_centro_custo?: number | null
          id_empresa_cc?: number | null
          qtd_docs?: number | null
          tipo_dc?: string | null
          total_pago_rateado?: number | null
          total_rateado?: number | null
        }
        Update: {
          data_competencia?: string | null
          descricao_cc?: string | null
          id?: never
          id_centro_custo?: number | null
          id_empresa_cc?: number | null
          qtd_docs?: number | null
          tipo_dc?: string | null
          total_pago_rateado?: number | null
          total_rateado?: number | null
        }
        Relationships: []
      }
      vw_fin_contas_fin: {
        Row: {
          descricao: string | null
          id: number
          id_conta_fin: number | null
          id_empresa: number | null
          num_agencia: string | null
          num_conta: string | null
          saldo_atual: number | null
          tipo: string | null
        }
        Insert: {
          descricao?: string | null
          id?: never
          id_conta_fin?: number | null
          id_empresa?: number | null
          num_agencia?: string | null
          num_conta?: string | null
          saldo_atual?: number | null
          tipo?: string | null
        }
        Update: {
          descricao?: string | null
          id?: never
          id_conta_fin?: number | null
          id_empresa?: number | null
          num_agencia?: string | null
          num_conta?: string | null
          saldo_atual?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_fin_cp: {
        Row: {
          baixa: string | null
          chdados: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          num_doc: string | null
          valor_total: number | null
        }
        Insert: {
          baixa?: string | null
          chdados?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          fl_pago?: number | null
          fl_vencido?: number | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Update: {
          baixa?: string | null
          chdados?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          fl_pago?: number | null
          fl_vencido?: number | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      vw_fin_cr: {
        Row: {
          baixa: string | null
          ch_mov_parc1: number | null
          chdados: number | null
          chforma_pag: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_ate_pagamento: number | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          num_doc: string | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Insert: {
          baixa?: string | null
          ch_mov_parc1?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_ate_pagamento?: number | null
          dias_atraso?: number | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          fl_pago?: number | null
          fl_vencido?: number | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          num_doc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Update: {
          baixa?: string | null
          ch_mov_parc1?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_ate_pagamento?: number | null
          dias_atraso?: number | null
          dt_baixa?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          fl_pago?: number | null
          fl_vencido?: number | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          num_doc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Relationships: []
      }
      vw_fin_desp_categoria: {
        Row: {
          chdados: number | null
          data_competencia: string | null
          desc_tipo_fatura: string | null
          id: number
          id_tipo_fatura: number | null
          qtd_docs: number | null
          total_pago: number | null
          total_previsto: number | null
        }
        Insert: {
          chdados?: number | null
          data_competencia?: string | null
          desc_tipo_fatura?: string | null
          id?: never
          id_tipo_fatura?: number | null
          qtd_docs?: number | null
          total_pago?: number | null
          total_previsto?: number | null
        }
        Update: {
          chdados?: number | null
          data_competencia?: string | null
          desc_tipo_fatura?: string | null
          id?: never
          id_tipo_fatura?: number | null
          qtd_docs?: number | null
          total_pago?: number | null
          total_previsto?: number | null
        }
        Relationships: []
      }
      vw_fin_dre_mensal: {
        Row: {
          ano: number | null
          chdados: number | null
          desc_tipo_fatura: string | null
          id: number
          id_tipo_fatura: number | null
          mes: number | null
          tipo_dc: string | null
          total_previsto: number | null
          total_realizado: number | null
        }
        Insert: {
          ano?: number | null
          chdados?: number | null
          desc_tipo_fatura?: string | null
          id?: never
          id_tipo_fatura?: number | null
          mes?: number | null
          tipo_dc?: string | null
          total_previsto?: number | null
          total_realizado?: number | null
        }
        Update: {
          ano?: number | null
          chdados?: number | null
          desc_tipo_fatura?: string | null
          id?: never
          id_tipo_fatura?: number | null
          mes?: number | null
          tipo_dc?: string | null
          total_previsto?: number | null
          total_realizado?: number | null
        }
        Relationships: []
      }
      vw_fin_fluxo_diario: {
        Row: {
          chdados: number | null
          data_ref: string | null
          desc_conta_fin: string | null
          id: number
          qtd_docs: number | null
          tipo_dc: string | null
          total_previsto: number | null
          total_realizado: number | null
        }
        Insert: {
          chdados?: number | null
          data_ref?: string | null
          desc_conta_fin?: string | null
          id?: never
          qtd_docs?: number | null
          tipo_dc?: string | null
          total_previsto?: number | null
          total_realizado?: number | null
        }
        Update: {
          chdados?: number | null
          data_ref?: string | null
          desc_conta_fin?: string | null
          id?: never
          qtd_docs?: number | null
          tipo_dc?: string | null
          total_previsto?: number | null
          total_realizado?: number | null
        }
        Relationships: []
      }
      vw_fin_mov_base: {
        Row: {
          baixa: string | null
          ch_mov_parc1: number | null
          chdados: number | null
          chforma_pag: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dt_baixa: string | null
          dt_cadastro: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          historico: string | null
          id: number
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          modalidade: string | null
          num_doc: string | null
          parcela: number | null
          tipo_conta_fin: string | null
          tipo_dc: string | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Insert: {
          baixa?: string | null
          ch_mov_parc1?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dt_baixa?: string | null
          dt_cadastro?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          modalidade?: string | null
          num_doc?: string | null
          parcela?: number | null
          tipo_conta_fin?: string | null
          tipo_dc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Update: {
          baixa?: string | null
          ch_mov_parc1?: number | null
          chdados?: number | null
          chforma_pag?: number | null
          data_competencia?: string | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dt_baixa?: string | null
          dt_cadastro?: string | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id?: never
          id_condpag?: number | null
          id_conta_fin?: number | null
          id_contato?: number | null
          id_mov?: number | null
          id_tipo_fatura?: number | null
          modalidade?: string | null
          num_doc?: string | null
          parcela?: number | null
          tipo_conta_fin?: string | null
          tipo_dc?: string | null
          valor_total?: number | null
          valor_total_aprov?: number | null
        }
        Relationships: []
      }
      vw_fin_mov_cc: {
        Row: {
          descricao_cc: string | null
          id: number
          id_centro_custo: number | null
          id_empresa_cc: number | null
          id_mov: number | null
          percent_participacao: number | null
          valor_rateado: number | null
        }
        Insert: {
          descricao_cc?: string | null
          id?: never
          id_centro_custo?: number | null
          id_empresa_cc?: number | null
          id_mov?: number | null
          percent_participacao?: number | null
          valor_rateado?: number | null
        }
        Update: {
          descricao_cc?: string | null
          id?: never
          id_centro_custo?: number | null
          id_empresa_cc?: number | null
          id_mov?: number | null
          percent_participacao?: number | null
          valor_rateado?: number | null
        }
        Relationships: []
      }
      vw_fin_top_fornecedor: {
        Row: {
          chdados: number | null
          data_competencia: string | null
          id: number
          id_contato: number | null
          nome_contato: string | null
          qtd_docs: number | null
          total_pago: number | null
          total_previsto: number | null
        }
        Insert: {
          chdados?: number | null
          data_competencia?: string | null
          id?: never
          id_contato?: number | null
          nome_contato?: string | null
          qtd_docs?: number | null
          total_pago?: number | null
          total_previsto?: number | null
        }
        Update: {
          chdados?: number | null
          data_competencia?: string | null
          id?: never
          id_contato?: number | null
          nome_contato?: string | null
          qtd_docs?: number | null
          total_pago?: number | null
          total_previsto?: number | null
        }
        Relationships: []
      }
      vw_os_base: {
        Row: {
          cancelada: string | null
          data_entrada: string | null
          data_faturamento: string | null
          data_finalizacao: string | null
          data_saida: string | null
          empresa: string | null
          fl_ag_fat: number | null
          fl_em_andamento: number | null
          fl_faturada: number | null
          id: number
          id_cliente: number | null
          id_empresa: number | null
          id_movimento: number | null
          id_os: number | null
          id_tipo_os: number | null
          id_vendedor: number | null
          num_controle: string | null
          status_os: string | null
          tipo_os: string | null
          vl_peca: number | null
          vl_servico: number | null
          vl_total: number | null
        }
        Insert: {
          cancelada?: string | null
          data_entrada?: string | null
          data_faturamento?: string | null
          data_finalizacao?: string | null
          data_saida?: string | null
          empresa?: string | null
          fl_ag_fat?: number | null
          fl_em_andamento?: number | null
          fl_faturada?: number | null
          id?: number
          id_cliente?: number | null
          id_empresa?: number | null
          id_movimento?: number | null
          id_os?: number | null
          id_tipo_os?: number | null
          id_vendedor?: number | null
          num_controle?: string | null
          status_os?: string | null
          tipo_os?: string | null
          vl_peca?: number | null
          vl_servico?: number | null
          vl_total?: number | null
        }
        Update: {
          cancelada?: string | null
          data_entrada?: string | null
          data_faturamento?: string | null
          data_finalizacao?: string | null
          data_saida?: string | null
          empresa?: string | null
          fl_ag_fat?: number | null
          fl_em_andamento?: number | null
          fl_faturada?: number | null
          id?: number
          id_cliente?: number | null
          id_empresa?: number | null
          id_movimento?: number | null
          id_os?: number | null
          id_tipo_os?: number | null
          id_vendedor?: number | null
          num_controle?: string | null
          status_os?: string | null
          tipo_os?: string | null
          vl_peca?: number | null
          vl_servico?: number | null
          vl_total?: number | null
        }
        Relationships: []
      }
      vw_os_pecas_faturadas: {
        Row: {
          custo_total: number | null
          custo_unit: number | null
          data_faturamento: string | null
          data_finalizacao_os: string | null
          empresa: string | null
          grupo: string | null
          id: number
          id_categoria: number | null
          id_cliente: number | null
          id_empresa: number | null
          id_grupo: number | null
          id_item: number | null
          id_os: number | null
          id_produto: number | null
          id_servico_os: number | null
          id_subgrupo: number | null
          id_vendedor: number | null
          margem_item: number | null
          produto: string | null
          qtd: number | null
          referencia: string | null
          situacao_produto: string | null
          subgrupo: string | null
          tipo_produto: string | null
          total_item: number | null
          vl_desc: number | null
          vl_unit: number | null
        }
        Insert: {
          custo_total?: number | null
          custo_unit?: number | null
          data_faturamento?: string | null
          data_finalizacao_os?: string | null
          empresa?: string | null
          grupo?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item?: number | null
          id_os?: number | null
          id_produto?: number | null
          id_servico_os?: number | null
          id_subgrupo?: number | null
          id_vendedor?: number | null
          margem_item?: number | null
          produto?: string | null
          qtd?: number | null
          referencia?: string | null
          situacao_produto?: string | null
          subgrupo?: string | null
          tipo_produto?: string | null
          total_item?: number | null
          vl_desc?: number | null
          vl_unit?: number | null
        }
        Update: {
          custo_total?: number | null
          custo_unit?: number | null
          data_faturamento?: string | null
          data_finalizacao_os?: string | null
          empresa?: string | null
          grupo?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_empresa?: number | null
          id_grupo?: number | null
          id_item?: number | null
          id_os?: number | null
          id_produto?: number | null
          id_servico_os?: number | null
          id_subgrupo?: number | null
          id_vendedor?: number | null
          margem_item?: number | null
          produto?: string | null
          qtd?: number | null
          referencia?: string | null
          situacao_produto?: string | null
          subgrupo?: string | null
          tipo_produto?: string | null
          total_item?: number | null
          vl_desc?: number | null
          vl_unit?: number | null
        }
        Relationships: []
      }
      vw_os_servico_x_pecas_faturado: {
        Row: {
          custo_pecas: number | null
          data_faturamento: string | null
          grupo_serv: string | null
          id: number
          id_os: number | null
          id_servico_os: number | null
          margem_pecas: number | null
          qtd_pecas: number | null
          total_pecas: number | null
          total_servico: number | null
        }
        Insert: {
          custo_pecas?: number | null
          data_faturamento?: string | null
          grupo_serv?: string | null
          id?: number
          id_os?: number | null
          id_servico_os?: number | null
          margem_pecas?: number | null
          qtd_pecas?: number | null
          total_pecas?: number | null
          total_servico?: number | null
        }
        Update: {
          custo_pecas?: number | null
          data_faturamento?: string | null
          grupo_serv?: string | null
          id?: number
          id_os?: number | null
          id_servico_os?: number | null
          margem_pecas?: number | null
          qtd_pecas?: number | null
          total_pecas?: number | null
          total_servico?: number | null
        }
        Relationships: []
      }
      vw_os_servicos_faturados: {
        Row: {
          data_faturamento: string | null
          empresa: string | null
          grupo_serv: string | null
          id: number
          id_cliente: number | null
          id_empresa: number | null
          id_grupo_serv: number | null
          id_movimento: number | null
          id_os: number | null
          id_peca: number | null
          id_servico_catalogo: number | null
          id_servico_os: number | null
          id_tipo_os: number | null
          id_vendedor: number | null
          nome_servico: string | null
          qtd_servico: number | null
          status_os: string | null
          tipo_os: string | null
          total_servico: number | null
          vl_desc_servico: number | null
          vl_unit_servico: number | null
        }
        Insert: {
          data_faturamento?: string | null
          empresa?: string | null
          grupo_serv?: string | null
          id?: number
          id_cliente?: number | null
          id_empresa?: number | null
          id_grupo_serv?: number | null
          id_movimento?: number | null
          id_os?: number | null
          id_peca?: number | null
          id_servico_catalogo?: number | null
          id_servico_os?: number | null
          id_tipo_os?: number | null
          id_vendedor?: number | null
          nome_servico?: string | null
          qtd_servico?: number | null
          status_os?: string | null
          tipo_os?: string | null
          total_servico?: number | null
          vl_desc_servico?: number | null
          vl_unit_servico?: number | null
        }
        Update: {
          data_faturamento?: string | null
          empresa?: string | null
          grupo_serv?: string | null
          id?: number
          id_cliente?: number | null
          id_empresa?: number | null
          id_grupo_serv?: number | null
          id_movimento?: number | null
          id_os?: number | null
          id_peca?: number | null
          id_servico_catalogo?: number | null
          id_servico_os?: number | null
          id_tipo_os?: number | null
          id_vendedor?: number | null
          nome_servico?: string | null
          qtd_servico?: number | null
          status_os?: string | null
          tipo_os?: string | null
          total_servico?: number | null
          vl_desc_servico?: number | null
          vl_unit_servico?: number | null
        }
        Relationships: []
      }
      vw_serv_apontamentos_base: {
        Row: {
          data_apontamento: string | null
          departamento: string | null
          empresa: string | null
          fator: number | null
          hora_inicio: string | null
          hora_termino: string | null
          horas_calculadas: number | null
          horas_informadas: number | null
          horas_trabalhadas: number | null
          id: number
          id_apontamento: number | null
          id_colaborador: number | null
          id_departamento: number | null
          id_empresa: number | null
          id_funcserv_os: number | null
          id_os: number | null
          id_servico: number | null
          id_servico_os: number | null
          nome_colaborador: string | null
        }
        Insert: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Update: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Relationships: []
      }
      whatsapp_conversas: {
        Row: {
          criado_em: string | null
          id: string
          mensagem: string
          nome: string | null
          role: string
          telefone: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          mensagem: string
          nome?: string | null
          role: string
          telefone: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          mensagem?: string
          nome?: string | null
          role?: string
          telefone?: string
        }
        Relationships: []
      }
    }
    Views: {
      assist_chamados_detalhe: {
        Row: {
          atualizado_em: string | null
          causa: string | null
          causa_id: number | null
          cliente_cidade: string | null
          cliente_email: string | null
          cliente_id_erp: number | null
          cliente_nome_erp: string | null
          cliente_nome_final: string | null
          cliente_telefone1: string | null
          cliente_telefone2: string | null
          cliente_telefone3: string | null
          cliente_uf: string | null
          cliente_vinculado_manual: boolean | null
          concluido: boolean | null
          criado_em: string | null
          data_abertura: string | null
          data_conclusao: string | null
          data_proxima_acao: string | null
          data_ultimo_followup: string | null
          defeito: string | null
          defeito_id: number | null
          descricao_inicial: string | null
          id: number | null
          justificativa_cliente_nao_vinculado: string | null
          nome_contato: string | null
          observacao_interna: string | null
          prioridade: string | null
          prioridade_id: number | null
          procedencia: string | null
          procedencia_id: number | null
          produto_codigo: string | null
          produto_id_erp: number | null
          produto_manual: string | null
          produto_nome: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          setor_responsavel: string | null
          setor_responsavel_id: number | null
          solucao: string | null
          solucao_id: number | null
          status_id: number | null
          status_nome: string | null
          status_ordem: number | null
          telefone: string | null
          telefone_normalizado: string | null
          umbler_conversa_id: string | null
          umbler_mensagem_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assist_chamados_causa_id_fkey"
            columns: ["causa_id"]
            isOneToOne: false
            referencedRelation: "assist_causas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_defeito_id_fkey"
            columns: ["defeito_id"]
            isOneToOne: false
            referencedRelation: "assist_defeitos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["prioridade_id"]
          },
          {
            foreignKeyName: "assist_chamados_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "assist_prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_procedencia_id_fkey"
            columns: ["procedencia_id"]
            isOneToOne: false
            referencedRelation: "assist_procedencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_setor_responsavel_id_fkey"
            columns: ["setor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["setor_responsavel_id"]
          },
          {
            foreignKeyName: "assist_chamados_setor_responsavel_id_fkey"
            columns: ["setor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "assist_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_solucao_id_fkey"
            columns: ["solucao_id"]
            isOneToOne: false
            referencedRelation: "assist_solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assist_chamados_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "assist_kanban"
            referencedColumns: ["status_id"]
          },
          {
            foreignKeyName: "assist_chamados_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "assist_status"
            referencedColumns: ["id"]
          },
        ]
      }
      assist_clientes_telefone_lookup: {
        Row: {
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          email: string | null
          id_cliente: number | null
          nome_cliente: string | null
          tel1_norm: string | null
          tel2_norm: string | null
          tel3_norm: string | null
          telefone1: string | null
          telefone2: string | null
          telefone3: string | null
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          id_cliente?: number | null
          nome_cliente?: string | null
          tel1_norm?: never
          tel2_norm?: never
          tel3_norm?: never
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          email?: string | null
          id_cliente?: number | null
          nome_cliente?: string | null
          tel1_norm?: never
          tel2_norm?: never
          tel3_norm?: never
          telefone1?: string | null
          telefone2?: string | null
          telefone3?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      assist_indice_defeito: {
        Row: {
          chamados_abertos: number | null
          chamados_garantia: number | null
          classificacao: string | null
          grupo: string | null
          id_produto: number | null
          indice_defeito_pct: number | null
          produto_nome: string | null
          qtd_vendida_12m: number | null
          referencia: string | null
          tempo_medio_dias: number | null
        }
        Relationships: []
      }
      assist_kanban: {
        Row: {
          bloqueado: boolean | null
          cidade: string | null
          cliente_id_erp: number | null
          cliente_nome: string | null
          concluido: boolean | null
          data_abertura: string | null
          data_conclusao: string | null
          data_proxima_acao: string | null
          data_ultimo_followup: string | null
          dias_aberto: number | null
          dias_sem_followup: number | null
          finaliza_chamado: boolean | null
          id: number | null
          natureza: string | null
          nome_contato: string | null
          prioridade: string | null
          prioridade_id: number | null
          produto_codigo: string | null
          produto_id_erp: number | null
          produto_nome: string | null
          responsavel_id: number | null
          responsavel_nome: string | null
          setor_responsavel: string | null
          setor_responsavel_id: number | null
          status_id: number | null
          status_nome: string | null
          status_ordem: number | null
          telefone: string | null
          telefone_normalizado: string | null
          uf: string | null
        }
        Relationships: []
      }
      assist_kpis: {
        Row: {
          chamados_abertos: number | null
          chamados_concluidos_mes: number | null
          chamados_parados: number | null
          produtos_com_chamado: number | null
          tempo_medio_resolucao_dias: number | null
        }
        Relationships: []
      }
      assist_pecas_utilizadas_resumo: {
        Row: {
          chamados: number | null
          nome_peca: string | null
          peca_ref: string | null
          quantidade_total: number | null
          ultima_utilizacao: string | null
        }
        Relationships: []
      }
      assist_produtos_criticos: {
        Row: {
          chamados_abertos: number | null
          produto_nome: string | null
          produto_ref: string | null
          tempo_medio_resolucao_dias: number | null
          total_chamados: number | null
          ultima_abertura: string | null
        }
        Relationships: []
      }
      atac_crm_clientes: {
        Row: {
          alerta_sem_interacao: boolean | null
          dias_sem_compra: number | null
          dias_sem_interacao: number | null
          faturamento_total: number | null
          id_cliente: number | null
          id_vendedor_responsavel: number | null
          nome_cliente: string | null
          nome_vendedor_responsavel: string | null
          qtd_pedidos: number | null
          status_crm: string | null
          ultima_compra: string | null
          ultima_interacao: string | null
          ultima_nota_crm: string | null
          ultimo_contato_umbler: string | null
        }
        Relationships: []
      }
      atac_prospeccao: {
        Row: {
          dias_sem_compra: number | null
          faturamento_total_erp: number | null
          id_cliente: number | null
          id_vendedor_responsavel: number | null
          nome_cliente: string | null
          nome_vendedor_responsavel: string | null
          origem_ultima_compra: string | null
          qtd_pedidos_erp: number | null
          ultima_compra: string | null
        }
        Relationships: []
      }
      cob_base: {
        Row: {
          chdados: number | null
          chforma_pag: number | null
          desc_condpag: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number | null
          id_contato: number | null
          id_mov: number | null
          modalidade: string | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      cob_historico_acoes: {
        Row: {
          created_at: string | null
          data_acao: string | null
          fin_cr_id: number | null
          id: number | null
          observacao: string | null
          operador_nome: string | null
          resultado: string | null
          tipo_acao: string | null
        }
        Relationships: []
      }
      cob_kanban_dados: {
        Row: {
          chdados: number | null
          dias_atraso: number | null
          dt_vencimento: string | null
          email: string | null
          id: number | null
          id_contato: number | null
          nome_contato: string | null
          num_doc: string | null
          saldo_cliente: number | null
          saldo_real: number | null
          telefone1: string | null
          telefone2: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      cob_kanban_mat: {
        Row: {
          chdados: number | null
          dias_atraso: number | null
          dt_vencimento: string | null
          email: string | null
          id: number | null
          id_contato: number | null
          nome_contato: string | null
          num_doc: string | null
          saldo_cliente: number | null
          saldo_real: number | null
          telefone1: string | null
          telefone2: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      cob_kpi_operacao: {
        Row: {
          acoes_registradas: number | null
          operadores_ativos: number | null
          titulos_com_acao: number | null
        }
        Relationships: []
      }
      cob_protestados: {
        Row: {
          data_acao: string | null
          data_protocolo: string | null
          dt_vencimento: string | null
          fin_cr_id: number | null
          id_contato: number | null
          nome_contato: string | null
          num_doc: string | null
          protocolo_numero: string | null
          saldo_real: number | null
          status_protocolo: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      cob_recebimentos_periodo: {
        Row: {
          ano_mes_vencimento: string | null
          ano_vencimento: number | null
          chdados: number | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          id: number | null
          id_contato: number | null
          mes_vencimento: number | null
          modalidade: string | null
          nome_contato: string | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      cob_saldo_cliente: {
        Row: {
          id_contato: number | null
          qtd_registros_saldo: number | null
          saldo_disponivel: number | null
        }
        Relationships: []
      }
      cob_titulos_com_cliente: {
        Row: {
          chdados: number | null
          chforma_pag: number | null
          cidade: string | null
          desc_condpag: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          email: string | null
          id: number | null
          id_contato: number | null
          id_mov: number | null
          modalidade: string | null
          nome_contato: string | null
          num_doc: string | null
          saldo_cliente: number | null
          saldo_real: number | null
          telefone1: string | null
          telefone2: string | null
          uf: string | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      cob_titulos_para_automatizacao: {
        Row: {
          chdados: number | null
          chforma_pag: number | null
          desc_condpag: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          id: number | null
          id_contato: number | null
          id_mov: number | null
          modalidade: string | null
          num_doc: string | null
          pode_cobrar_automatico: boolean | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      comp_alertas: {
        Row: {
          cobertura_dias: number | null
          consumo_medio_diario: number | null
          curva_abc_qtd: string | null
          curva_abc_valor: string | null
          dt_ultima_compra: string | null
          dt_ultima_venda: string | null
          empresa: string | null
          estoque_fisico: number | null
          estoque_reserva: number | null
          grupo: string | null
          id_empresa: number | null
          id_produto: number | null
          nome: string | null
          preco_compra: number | null
          preco_compra_medio: number | null
          preco_venda: number | null
          qtd_pedido_aberto: number | null
          qtd_saida_90d: number | null
          qtd_sugerida: number | null
          referencia: string | null
          situacao_estoque: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      comp_lead_time_forn: {
        Row: {
          id_fornecedor: number | null
          lead_time_max: number | null
          lead_time_medio: number | null
          lead_time_min: number | null
          nome_fornecedor: string | null
          qtd_compras: number | null
          qtd_produtos_comprados: number | null
          ultima_compra: string | null
          valor_total_comprado: number | null
        }
        Relationships: []
      }
      comp_lead_time_pedido: {
        Row: {
          id_fornecedor: number | null
          lead_pedido_max: number | null
          lead_pedido_medio: number | null
          lead_pedido_min: number | null
          nome_fornecedor: string | null
          qtd_pares: number | null
          ultima_nf: string | null
        }
        Relationships: []
      }
      comp_produtos_consolidado: {
        Row: {
          cobertura_dias: number | null
          consumo_diario_total: number | null
          curva_abc_qtd: string | null
          curva_abc_valor: string | null
          dt_ultima_compra: string | null
          dt_ultima_venda: string | null
          estoque_total: number | null
          grupo: string | null
          id_produto: number | null
          nome: string | null
          pedido_aberto_total: number | null
          preco_compra: number | null
          qtd_sugerida: number | null
          referencia: string | null
          reserva_total: number | null
          saida_90d_total: number | null
          situacao_estoque: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      comp_produtos_resumo: {
        Row: {
          cobertura_dias: number | null
          consumo_medio_diario: number | null
          curva_abc_qtd: string | null
          curva_abc_valor: string | null
          dt_ultima_compra: string | null
          dt_ultima_venda: string | null
          empresa: string | null
          estoque_fisico: number | null
          estoque_reserva: number | null
          grupo: string | null
          id_empresa: number | null
          id_produto: number | null
          nome: string | null
          preco_compra: number | null
          preco_compra_medio: number | null
          preco_venda: number | null
          qtd_pedido_aberto: number | null
          qtd_saida_90d: number | null
          qtd_sugerida: number | null
          referencia: string | null
          situacao_estoque: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      ecom_bononi_busca_cliente: {
        Row: {
          cidade: string | null
          cod_cliente: number | null
          cpf: string | null
          email: string | null
          ja_cadastrado_id: string | null
          nome: string | null
          situacao: string | null
          telefone: string | null
          uf: string | null
        }
        Relationships: []
      }
      ecom_bononi_clientes_lista: {
        Row: {
          ativo: boolean | null
          cod_cliente: number | null
          cpf: string | null
          data_cadastro: string | null
          id: string | null
          nome: string | null
          qtde_indicacoes: number | null
          saldo_dinheiro: number | null
          saldo_produto: number | null
          telefone: string | null
          total_conversoes: number | null
          updated_at: string | null
          valor_total_indicacoes: number | null
        }
        Relationships: []
      }
      ecom_bononi_clientes_resumo: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          data_cadastro: string | null
          email: string | null
          id: string | null
          nome: string | null
          saldo_dinheiro: number | null
          saldo_produto: number | null
          total_conversoes: number | null
          total_ganho_dinheiro: number | null
          total_ganho_produto: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          saldo_dinheiro?: number | null
          saldo_produto?: number | null
          total_conversoes?: number | null
          total_ganho_dinheiro?: number | null
          total_ganho_produto?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string | null
          nome?: string | null
          saldo_dinheiro?: number | null
          saldo_produto?: number | null
          total_conversoes?: number | null
          total_ganho_dinheiro?: number | null
          total_ganho_produto?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ecom_bononi_resgates_resumo: {
        Row: {
          aprovado_por: string | null
          chave_pix: string | null
          codigo_produto: string | null
          cpf: string | null
          data_pagamento: string | null
          data_solicitacao: string | null
          dias_esperando: number | null
          id: string | null
          id_cliente: string | null
          nome: string | null
          origem: string | null
          status: string | null
          tipo: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "bononi_indica_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_resgates_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_bononi_vendas_resumo: {
        Row: {
          comissao_dinheiro: number | null
          comissao_produto: number | null
          cpf: string | null
          data_lancamento: string | null
          data_venda: string | null
          id: string | null
          id_cliente_indicador: string | null
          lancado_por: string | null
          nome: string | null
          numero_nf: string | null
          observacao: string | null
          valor_venda: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "bononi_indica_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bononi_indica_vendas_id_cliente_indicador_fkey"
            columns: ["id_cliente_indicador"]
            isOneToOne: false
            referencedRelation: "ecom_bononi_clientes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_bononi_vendedores_ranking: {
        Row: {
          comissao_dinheiro_total: number | null
          comissao_produto_total: number | null
          comissao_total: number | null
          qtde_clientes_indicados: number | null
          qtde_vendas: number | null
          valor_total: number | null
          vendedor: string | null
        }
        Relationships: []
      }
      ecom_campanhas_custos: {
        Row: {
          campanha: string | null
          comprou: number | null
          custo_por_comprou: number | null
          custo_por_interessado: number | null
          custo_por_lead: number | null
          custo_total: number | null
          interessados: number | null
          subgrupo_produto: string | null
          total_leads: number | null
        }
        Relationships: []
      }
      ecom_ids_sem_vinculo: {
        Row: {
          id_vendedor: string | null
          nome_vendedor: string | null
          primeiro: string | null
          total_leads: number | null
          ultimo: string | null
        }
        Relationships: []
      }
      ecom_pedidos: {
        Row: {
          canal: string | null
          criado_em: string | null
          departamento: string | null
          forma_pagamento: string | null
          id: string | null
          id_vendedor: number | null
          nome_cliente: string | null
          numero_pedido: string | null
          status: string | null
          telefone_cliente: string | null
          updated_at: string | null
          valor_frete: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      ecom_subgrupo_vendas: {
        Row: {
          data_faturamento: string | null
          faturamento_site: number | null
          faturamento_total: number | null
          faturamento_vendedores: number | null
          grupo: string | null
          qtd_vendas: number | null
          subgrupo: string | null
          ticket_medio: number | null
          vendas_site: number | null
          vendas_vendedores: number | null
        }
        Relationships: []
      }
      fin_alertas: {
        Row: {
          descricao_extra: string | null
          qtd: number | null
          tipo_alerta: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      fin_comercial_diario: {
        Row: {
          custo: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          id_empresa: number | null
          margem: number | null
          qtd_docs: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      fin_cp_compras: {
        Row: {
          baixa: string | null
          chdados: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number | null
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      fin_cp_dedup: {
        Row: {
          baixa: string | null
          chdados: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number | null
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      fin_cp_por_categoria: {
        Row: {
          chdados: number | null
          desc_tipo_fatura: string | null
          id_tipo_fatura: number | null
          qtd_titulos: number | null
          total_em_aberto: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cp_quinzena: {
        Row: {
          chdados: number | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          faixa: string | null
          qtd: number | null
          total: number | null
        }
        Relationships: []
      }
      fin_cp_ranking_fornecedores: {
        Row: {
          chdados: number | null
          id_contato: number | null
          maior_atraso_dias: number | null
          qtd_titulos_vencidos: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cp_resumo: {
        Row: {
          a_pagar_30d: number | null
          chdados: number | null
          qtd_titulos_vencidos: number | null
          total_em_aberto: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cp_titulos_vencidos: {
        Row: {
          chdados: number | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          historico: string | null
          id_contato: number | null
          id_mov: number | null
          num_doc: string | null
          valor_total: number | null
        }
        Insert: {
          chdados?: number | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id_contato?: number | null
          id_mov?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Update: {
          chdados?: number | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id_contato?: number | null
          id_mov?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      fin_cr_concentracao_canal: {
        Row: {
          canal: string | null
          chdados: number | null
          id_contato: number | null
          perc_canal: number | null
          ranking: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cr_dedup: {
        Row: {
          baixa: string | null
          ch_mov_parc1: number | null
          chdados: number | null
          chforma_pag: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_ate_pagamento: number | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number | null
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          modalidade: string | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      fin_cr_evolucao_canal: {
        Row: {
          canal: string | null
          mes: string | null
          qtd: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cr_evolucao_inadimplencia: {
        Row: {
          chdados: number | null
          mes: string | null
          qtd_titulos: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_cr_maiores_recebimentos: {
        Row: {
          chdados: number | null
          id_contato: number | null
          mes: string | null
          nome_contato: string | null
          qtd_titulos: number | null
          total_recebido: number | null
        }
        Relationships: []
      }
      fin_cr_titulos_vencidos: {
        Row: {
          chdados: number | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_atraso: number | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          historico: string | null
          id_contato: number | null
          id_mov: number | null
          num_doc: string | null
          valor_total: number | null
        }
        Insert: {
          chdados?: number | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id_contato?: number | null
          id_mov?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Update: {
          chdados?: number | null
          desc_condpag?: string | null
          desc_conta_fin?: string | null
          desc_tipo_fatura?: string | null
          dias_atraso?: number | null
          dt_faturamento?: string | null
          dt_vencimento?: string | null
          historico?: string | null
          id_contato?: number | null
          id_mov?: number | null
          num_doc?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      fin_cr_vendas: {
        Row: {
          baixa: string | null
          ch_mov_parc1: number | null
          chdados: number | null
          data_competencia: string | null
          desc_condpag: string | null
          desc_conta_fin: string | null
          desc_tipo_fatura: string | null
          dias_ate_pagamento: number | null
          dias_atraso: number | null
          dt_baixa: string | null
          dt_faturamento: string | null
          dt_vencimento: string | null
          fl_pago: number | null
          fl_vencido: number | null
          historico: string | null
          id: number | null
          id_condpag: number | null
          id_conta_fin: number | null
          id_contato: number | null
          id_mov: number | null
          id_tipo_fatura: number | null
          modalidade: string | null
          num_doc: string | null
          saldo_real: number | null
          valor_total: number | null
          valor_total_aprov: number | null
        }
        Relationships: []
      }
      fin_dre_analitico: {
        Row: {
          baixa: string | null
          chdados: number | null
          classificacao: string | null
          desc_conta: string | null
          desc_grupo_rd: string | null
          mes: string | null
          tipo_grupo: string | null
          valor: number | null
        }
        Relationships: []
      }
      fin_dre_completo: {
        Row: {
          cmv: number | null
          despesa_total: number | null
          id_empresa: number | null
          margem_bruta: number | null
          margem_liquida: number | null
          margem_pct: number | null
          mes: string | null
          receita_bruta: number | null
          receita_liquida: number | null
          resultado_caixa: number | null
          resultado_op_pct: number | null
          resultado_operacional: number | null
          total_pago: number | null
          total_recebido: number | null
        }
        Relationships: []
      }
      fin_dre_por_cc: {
        Row: {
          descricao_cc: string | null
          despesa_cc: number | null
          id_centro_custo: number | null
          id_empresa_cc: number | null
          mes: string | null
          receita_cc: number | null
          resultado_cc: number | null
        }
        Relationships: []
      }
      fin_evolucao_caixa: {
        Row: {
          empresa: string | null
          id_empresa: number | null
          mes: string | null
          saldo_mes: number | null
          total_entradas: number | null
          total_saidas: number | null
        }
        Relationships: []
      }
      fin_fluxo_futuro: {
        Row: {
          chdados: number | null
          desc_conta_fin: string | null
          tipo_dc: string | null
          total_15d: number | null
          total_30d: number | null
          total_60d: number | null
          total_7d: number | null
          total_90d: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_grupos_periodo: {
        Row: {
          custo: number | null
          faturamento: number | null
          grupo: string | null
          id_grupo: number | null
          id_subgrupo: number | null
          margem: number | null
          mes: string | null
          qtd: number | null
          subgrupo: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      fin_inadimplencia_canal: {
        Row: {
          canal: string | null
          chdados: number | null
          perc_inadimplencia: number | null
          qtd_titulos: number | null
          total_aberto: number | null
          total_vencido: number | null
        }
        Relationships: []
      }
      fin_pmr: {
        Row: {
          chdados: number | null
          mes: string | null
          pmr_medio: number | null
          qtd_titulos: number | null
        }
        Relationships: []
      }
      fin_produtos_periodo: {
        Row: {
          custo: number | null
          faturamento: number | null
          grupo: string | null
          id_produto: number | null
          margem: number | null
          mes: string | null
          produto: string | null
          qtd: number | null
          subgrupo: string | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      fin_resultado_periodo: {
        Row: {
          cmv: number | null
          cmv_pago: number | null
          credito_china: number | null
          despesa_operacional: number | null
          id_empresa: number | null
          margem_bruta: number | null
          margem_pct: number | null
          mes: string | null
          receita_bruta: number | null
          resultado_caixa: number | null
          resultado_operacional: number | null
          total_pago: number | null
          total_recebido: number | null
        }
        Relationships: []
      }
      fin_rh_colaborador: {
        Row: {
          canal: string | null
          data_competencia: string | null
          departamento: string | null
          descricao_cc: string | null
          empresa: string | null
          id_colaborador: number | null
          id_empresa: number | null
          nome_colaborador: string | null
          tipo_custo: string | null
          valor: number | null
        }
        Relationships: []
      }
      fin_rh_custo_colaborador: {
        Row: {
          beneficios: number | null
          canal: string | null
          comissao: number | null
          custo_total: number | null
          decimo_terceiro: number | null
          departamento: string | null
          empresa: string | null
          ferias: number | null
          fgts: number | null
          id_colaborador: number | null
          id_empresa: number | null
          inss: number | null
          irrf: number | null
          mes: string | null
          nome_colaborador: string | null
          rescisao: number | null
          salario: number | null
        }
        Relationships: []
      }
      fin_rh_folha_mensal: {
        Row: {
          canal: string | null
          empresa: string | null
          id_empresa: number | null
          mes: string | null
          qtd_colaboradores: number | null
          tipo_custo: string | null
          total: number | null
        }
        Relationships: []
      }
      fin_saldo_acumulado: {
        Row: {
          fluxo_mes: number | null
          mes: string | null
          saldo_acumulado: number | null
        }
        Relationships: []
      }
      fin_saldo_caixa: {
        Row: {
          descricao: string | null
          id_conta_fin: number | null
          id_empresa: number | null
          saldo_atual: number | null
          saldo_total: number | null
          tipo: string | null
        }
        Relationships: []
      }
      fin_vendas_canal: {
        Row: {
          canal: string | null
          cmv: number | null
          id_empresa: number | null
          margem_bruta: number | null
          margem_pct: number | null
          mes: string | null
          qtd_docs: number | null
          receita_bruta: number | null
        }
        Relationships: []
      }
      frt_auditoria_kpi: {
        Row: {
          ctes_cobrado_a_mais: number | null
          ctes_cobrado_a_menos: number | null
          perc_divergencia: number | null
          total_cobrado: number | null
          total_com_divergencia: number | null
          total_ctes: number | null
          total_divergencias: number | null
        }
        Relationships: []
      }
      frt_nf_sem_cte: {
        Row: {
          data_faturamento: string | null
          empresa: string | null
          frete_por_conta: string | null
          id_doc: number | null
          id_empresa: number | null
          id_transportadora: number | null
          nome_cliente: string | null
          nome_transportadora: string | null
          num_nf: string | null
          valor_frete: number | null
        }
        Insert: {
          data_faturamento?: string | null
          empresa?: string | null
          frete_por_conta?: string | null
          id_doc?: number | null
          id_empresa?: number | null
          id_transportadora?: number | null
          nome_cliente?: string | null
          nome_transportadora?: string | null
          num_nf?: string | null
          valor_frete?: number | null
        }
        Update: {
          data_faturamento?: string | null
          empresa?: string | null
          frete_por_conta?: string | null
          id_doc?: number | null
          id_empresa?: number | null
          id_transportadora?: number | null
          nome_cliente?: string | null
          nome_transportadora?: string | null
          num_nf?: string | null
          valor_frete?: number | null
        }
        Relationships: []
      }
      vw_bononi_busca_nf: {
        Row: {
          data_faturamento: string | null
          id_doc: number | null
          nome_cliente: string | null
          numero_nf: string | null
          valor: number | null
        }
        Insert: {
          data_faturamento?: string | null
          id_doc?: number | null
          nome_cliente?: string | null
          numero_nf?: never
          valor?: number | null
        }
        Update: {
          data_faturamento?: string | null
          id_doc?: number | null
          nome_cliente?: string | null
          numero_nf?: never
          valor?: number | null
        }
        Relationships: []
      }
      vw_bononi_comissoes_mes: {
        Row: {
          comissao_dinheiro: number | null
          comissao_produto: number | null
          mes: string | null
        }
        Relationships: []
      }
      vw_bononi_dashboard: {
        Row: {
          resgates_pendentes: number | null
          saldo_total_dinheiro: number | null
          saldo_total_produto: number | null
          total_clientes_ativos: number | null
        }
        Relationships: []
      }
      vw_com_prod_cresc: {
        Row: {
          ano: number | null
          cresc_perc: number | null
          cresc_valor: number | null
          fat_ant: number | null
          fat_atual: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          id_produto: number | null
          id_subgrupo: number | null
          mes: number | null
          produto: string | null
          referencia: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      vw_com_prod_queda: {
        Row: {
          ano: number | null
          cresc_perc: number | null
          cresc_valor: number | null
          fat_ant: number | null
          fat_atual: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          id_produto: number | null
          id_subgrupo: number | null
          mes: number | null
          produto: string | null
          referencia: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      vw_comercial_clientes: {
        Row: {
          custo_total: number | null
          empresa: string | null
          faturamento: number | null
          id_cliente: number | null
          id_empresa: number | null
          margem_perc: number | null
          margem_total: number | null
          nome_cliente: string | null
          qtd_docs: number | null
          ticket_medio: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_diario: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          id_empresa: number | null
          margem_total: number | null
          qtd_docs: number | null
          qtd_itens: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_docs_com_subgrupo: {
        Row: {
          data_faturamento: string | null
          faturamento_liquido: number | null
          grupo: string | null
          id_doc: number | null
          nome_cliente: string | null
          nome_vendedor: string | null
          qtd_produtos_unicos: number | null
          qtd_total_itens: number | null
          subgrupo: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_grupos: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          margem_perc: number | null
          margem_total: number | null
          qtd_vendida: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_loja: {
        Row: {
          custo_doc: number | null
          data_faturamento: string | null
          empresa: string | null
          faturamento_doc: number | null
          faturamento_liquido: number | null
          id: number | null
          id_cliente: number | null
          id_doc: number | null
          id_empresa: number | null
          id_vendedor: number | null
          margem_doc: number | null
          margem_liquida: number | null
          nome_cliente: string | null
          nome_vendedor: string | null
          qtd_itens_doc: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Insert: {
          custo_doc?: number | null
          data_faturamento?: string | null
          empresa?: string | null
          faturamento_doc?: number | null
          faturamento_liquido?: number | null
          id?: number | null
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_vendedor?: number | null
          margem_doc?: number | null
          margem_liquida?: number | null
          nome_cliente?: string | null
          nome_vendedor?: string | null
          qtd_itens_doc?: number | null
          tipo_doc?: string | null
          tipo_saida?: string | null
        }
        Update: {
          custo_doc?: number | null
          data_faturamento?: string | null
          empresa?: string | null
          faturamento_doc?: number | null
          faturamento_liquido?: number | null
          id?: number | null
          id_cliente?: number | null
          id_doc?: number | null
          id_empresa?: number | null
          id_vendedor?: number | null
          margem_doc?: number | null
          margem_liquida?: number | null
          nome_cliente?: string | null
          nome_vendedor?: string | null
          qtd_itens_doc?: number | null
          tipo_doc?: string | null
          tipo_saida?: string | null
        }
        Relationships: []
      }
      vw_comercial_mensal: {
        Row: {
          ano: number | null
          custo_total: number | null
          empresa: string | null
          faturamento: number | null
          id_empresa: number | null
          margem_total: number | null
          mes: number | null
          qtd_docs: number | null
          ticket_medio: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_os: {
        Row: {
          custo_doc: number | null
          data_faturamento: string | null
          empresa: string | null
          faturamento_doc: number | null
          id: number | null
          id_cliente: number | null
          id_doc: number | null
          id_empresa: number | null
          id_vendedor: number | null
          margem_doc: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_produtos: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          id_produto: number | null
          id_subgrupo: number | null
          margem_perc: number | null
          margem_total: number | null
          produto: string | null
          qtd_vendida: number | null
          referencia: string | null
          subgrupo: string | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_produtos_mensal: {
        Row: {
          ano: number | null
          custo: number | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          id_produto: number | null
          id_subgrupo: number | null
          margem: number | null
          mes: number | null
          produto: string | null
          qtd_vendida: number | null
          referencia: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      vw_comercial_subgrupos: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id_empresa: number | null
          id_grupo: number | null
          id_subgrupo: number | null
          margem_perc: number | null
          margem_total: number | null
          qtd_vendida: number | null
          subgrupo: string | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_comercial_vendedores: {
        Row: {
          custo_total: number | null
          empresa: string | null
          faturamento: number | null
          id_empresa: number | null
          id_vendedor: number | null
          margem_perc: number | null
          margem_total: number | null
          nome_vendedor: string | null
          qtd_docs: number | null
          ticket_medio: number | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_compras_ia_produtos_para_sugestao: {
        Row: {
          cobertura_dias: number | null
          consumo_diario_total: number | null
          curva_abc: string | null
          estoque_total: number | null
          grupo: string | null
          id_fornecedor: number | null
          id_produto: number | null
          nome_fornecedor: string | null
          pedido_aberto_total: number | null
          preco_base_sugestao: number | null
          preco_compra: number | null
          preco_fornecedor: number | null
          produto_nome: string | null
          qtd_sugerida: number | null
          referencia: string | null
          referencia_fornecedor: string | null
          situacao_estoque: string | null
          subgrupo: string | null
          valor_estimado_sugestao: number | null
        }
        Relationships: []
      }
      vw_compras_ia_sugestao_itens_detalhe: {
        Row: {
          cobertura_dias: number | null
          consumo_diario: number | null
          criado_em: string | null
          curva_abc: string | null
          estoque_atual: number | null
          fornecedor_nome: string | null
          id: string | null
          id_fornecedor: number | null
          id_produto: number | null
          metadados: Json | null
          motivo_sugestao: string | null
          numero_sugestao: string | null
          observacoes: string | null
          pedido_aberto: number | null
          preco_unitario: number | null
          produto_nome: string | null
          qtd_confirmada: number | null
          qtd_sugerida_ia: number | null
          referencia: string | null
          situacao_estoque: string | null
          status_sugestao: string | null
          sugestao_criado_em: string | null
          sugestao_id: string | null
          valor_total_estimado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_ia_sugestao_itens_sugestao_id_fkey"
            columns: ["sugestao_id"]
            isOneToOne: false
            referencedRelation: "compras_ia_sugestoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_ia_sugestao_itens_sugestao_id_fkey"
            columns: ["sugestao_id"]
            isOneToOne: false
            referencedRelation: "vw_compras_ia_sugestoes_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_compras_ia_sugestoes_resumo: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string | null
          fornecedor_nome: string | null
          id: string | null
          id_fornecedor: number | null
          itens_baixo: number | null
          itens_calculado: number | null
          itens_critico: number | null
          itens_curva_a: number | null
          itens_ruptura: number | null
          numero_sugestao: string | null
          origem: string | null
          pergunta_usuario: string | null
          qtd_total: number | null
          status: string | null
          total_itens: number | null
          valor_calculado: number | null
          valor_total_estimado: number | null
        }
        Relationships: []
      }
      vw_consumo_unificado: {
        Row: {
          consumo_diario: number | null
          consumo_diario_90d: number | null
          id_empresa: number | null
          id_produto: number | null
          saida_365d: number | null
          saida_90d: number | null
        }
        Relationships: []
      }
      vw_dim_contato: {
        Row: {
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          email: string | null
          id_contato: number | null
          latitude: string | null
          longitude: string | null
          nome_contato: string | null
          telefone1: string | null
          telefone2: string | null
          uf: string | null
        }
        Relationships: []
      }
      vw_ecom_atendimento: {
        Row: {
          convertido: boolean | null
          criado_em: string | null
          dia_semana: number | null
          etapa: string | null
          hora_chegada: number | null
          horas_sem_resposta: number | null
          id: string | null
          id_vendedor: string | null
          nome: string | null
          nome_vendedor: string | null
          sem_resposta: boolean | null
          telefone: string | null
          tempo_comercial_horas: number | null
          tempo_total_horas: number | null
          updated_at: string | null
        }
        Insert: {
          convertido?: boolean | null
          criado_em?: string | null
          dia_semana?: never
          etapa?: string | null
          hora_chegada?: never
          horas_sem_resposta?: never
          id?: string | null
          id_vendedor?: string | null
          nome?: string | null
          nome_vendedor?: string | null
          sem_resposta?: never
          telefone?: string | null
          tempo_comercial_horas?: never
          tempo_total_horas?: never
          updated_at?: string | null
        }
        Update: {
          convertido?: boolean | null
          criado_em?: string | null
          dia_semana?: never
          etapa?: string | null
          hora_chegada?: never
          horas_sem_resposta?: never
          id?: string | null
          id_vendedor?: string | null
          nome?: string | null
          nome_vendedor?: string | null
          sem_resposta?: never
          telefone?: string | null
          tempo_comercial_horas?: never
          tempo_total_horas?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      vw_ecom_atribuicao: {
        Row: {
          campanha: string | null
          canal: string | null
          conjunto: string | null
          data_lead: string | null
          data_pedido: string | null
          dias_lead_a_compra: number | null
          empresa: string | null
          id_empresa: number | null
          id_vendedor: number | null
          nome_cliente: string | null
          nome_vendedor: string | null
          numero_pedido: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      vw_ecom_atribuicao_v2: {
        Row: {
          anuncio: string | null
          campanha: string | null
          canal: string | null
          conjunto: string | null
          data_lead: string | null
          data_pedido: string | null
          departamento: string | null
          dias_lead_a_compra: number | null
          id_vendedor: number | null
          nome_cliente: string | null
          numero_pedido: string | null
          telefone_tintim: string | null
          tem_atribuicao: boolean | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      vw_ecom_campanhas: {
        Row: {
          campanha: string | null
          cliques: number | null
          conjunto: string | null
          convertidos: number | null
          custo_por_lead: number | null
          custo_por_venda: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          leads_umbler: number | null
          receita_gerada: number | null
          roas: number | null
          taxa_conversao_perc: number | null
        }
        Relationships: []
      }
      vw_ecom_espera_vendedor: {
        Row: {
          atendidos_5_15min: number | null
          atendidos_acima_15min: number | null
          atendidos_em_5min: number | null
          data_ref: string | null
          em_fila: number | null
          id_vendedor: string | null
          nome_vendedor: string | null
          tempo_max_min: number | null
          tempo_medio_min: number | null
          tempo_min_min: number | null
          total_atendidos: number | null
        }
        Relationships: []
      }
      vw_ecom_fila_bot: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          etapa: string | null
          id: string | null
          nome: string | null
          telefone: string | null
          tempo_esperando_horas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id?: string | null
          nome?: string | null
          telefone?: string | null
          tempo_esperando_horas?: never
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          etapa?: string | null
          id?: string | null
          nome?: string | null
          telefone?: string | null
          tempo_esperando_horas?: never
        }
        Relationships: []
      }
      vw_ecom_fila_espera: {
        Row: {
          atribuido_em: string | null
          entrou_bot: string | null
          etapa: string | null
          id: string | null
          id_vendedor: string | null
          minutos_espera: number | null
          nome: string | null
          nome_vendedor: string | null
          status_atendimento: string | null
          telefone: string | null
        }
        Relationships: []
      }
      vw_ecom_funil: {
        Row: {
          cliques: number | null
          convertidos: number | null
          ctr_perc: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          leads: number | null
          taxa_conversao_perc: number | null
          taxa_lead_perc: number | null
        }
        Relationships: []
      }
      vw_ecom_mapa_regiao: {
        Row: {
          cidade: string | null
          faturamento_total: number | null
          latitude: number | null
          longitude: number | null
          qtd_pedidos: number | null
          ticket_medio: number | null
          uf: string | null
        }
        Relationships: []
      }
      vw_ecom_mapa_vendas: {
        Row: {
          dia_semana: number | null
          faturamento_total: number | null
          hora_dia: number | null
          qtd_pedidos: number | null
        }
        Relationships: []
      }
      vw_ecom_marketplace: {
        Row: {
          custo_total: number | null
          data_fim: string | null
          data_inicio: string | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          id_vendedor: number | null
          margem_liquida: number | null
          margem_liquida_perc: number | null
          nome_vendedor: string | null
          qtd_pedidos: number | null
          taxa_media_perc: number | null
          taxa_total: number | null
        }
        Relationships: []
      }
      vw_ecom_produtos: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id: number | null
          id_empresa: number | null
          id_grupo: number | null
          id_produto: number | null
          id_subgrupo: number | null
          margem_perc: number | null
          margem_total: number | null
          produto: string | null
          qtd_vendida: number | null
          referencia: string | null
          subgrupo: string | null
        }
        Relationships: []
      }
      vw_ecom_resumo: {
        Row: {
          custo_por_lead: number | null
          investimento_total: number | null
          receita_total: number | null
          roas_geral: number | null
          taxa_conversao_perc: number | null
          total_convertidos: number | null
          total_leads: number | null
        }
        Relationships: []
      }
      vw_ecom_subgrupos: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          empresa: string | null
          faturamento: number | null
          grupo: string | null
          id: number | null
          id_empresa: number | null
          id_grupo: number | null
          id_subgrupo: number | null
          margem_perc: number | null
          margem_total: number | null
          qtd_vendida: number | null
          subgrupo: string | null
        }
        Relationships: []
      }
      vw_ecom_vendedores: {
        Row: {
          convertidos: number | null
          departamento: string | null
          faturamento_erp: number | null
          id_vendedor_erp: number | null
          leads_atendidos: number | null
          nome_vendedor: string | null
          qtd_docs: number | null
          taxa_conversao_perc: number | null
          tempo_medio_horas: number | null
          ticket_medio: number | null
          ultimo_lead: string | null
        }
        Relationships: []
      }
      vw_ecom_vendedores_comercial: {
        Row: {
          custo_total: number | null
          data_ref: string | null
          faturamento: number | null
          id_vendedor: number | null
          margem_perc: number | null
          margem_total: number | null
          nome_vendedor: string | null
          qtd_docs: number | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      vw_import_processos_resumo: {
        Row: {
          atualizado_em: string | null
          codigo: string | null
          criado_em: string | null
          criado_por: string | null
          data_chegada_real: string | null
          data_embarque: string | null
          data_prev_chegada: string | null
          id: string | null
          id_fornecedor: number | null
          importadora: string | null
          nome_fornecedor: string | null
          observacoes: string | null
          pagamentos_pendentes: number | null
          pedidos: number[] | null
          qtd_pagamentos: number | null
          qtd_pedidos: number | null
          status: string | null
          status_pgto: string | null
          total_a_pagar_brl: number | null
          total_pago_brl: number | null
          total_usd: number | null
          valor_total_brl: number | null
          valor_total_usd: number | null
        }
        Relationships: []
      }
      vw_loja_vendedores: {
        Row: {
          custo: number | null
          data_faturamento: string | null
          departamento: string | null
          empresa: string | null
          faturamento: number | null
          id_doc: number | null
          id_empresa: number | null
          id_vendedor: number | null
          margem: number | null
          margem_perc: number | null
          nome_vendedor: string | null
          tipo_doc: string | null
          tipo_saida: string | null
        }
        Relationships: []
      }
      vw_os_abert_60d: {
        Row: {
          data_entrada: string | null
          empresa: string | null
          qtd_os: number | null
          tipo_os: string | null
        }
        Relationships: []
      }
      vw_os_ag_fat_v2: {
        Row: {
          cliente: string | null
          data_finalizacao: string | null
          empresa: string | null
          id_os: number | null
          id_tipo_os: number | null
          tipo_os: string | null
          valor_total: number | null
          vendedor: string | null
        }
        Relationships: []
      }
      vw_os_andamento_v2: {
        Row: {
          cliente: string | null
          data_entrada: string | null
          empresa: string | null
          id_os: number | null
          id_tipo_os: number | null
          tipo_os: string | null
          valor_total: number | null
          vendedor: string | null
        }
        Relationships: []
      }
      vw_os_base_fat_corrigido: {
        Row: {
          cancelada: string | null
          data_entrada: string | null
          data_faturamento: string | null
          data_faturamento_corrigida: string | null
          data_finalizacao: string | null
          data_saida: string | null
          empresa: string | null
          fl_ag_fat: number | null
          fl_em_andamento: number | null
          fl_faturada: number | null
          id: number | null
          id_cliente: number | null
          id_empresa: number | null
          id_movimento: number | null
          id_os: number | null
          id_tipo_os: number | null
          id_vendedor: number | null
          num_controle: string | null
          status_os: string | null
          tipo_os: string | null
          vl_peca: number | null
          vl_servico: number | null
          vl_total: number | null
        }
        Relationships: []
      }
      vw_os_gerencial_cards_v2: {
        Row: {
          os_ag_fat: number | null
          os_andamento: number | null
          os_faturadas: number | null
          os_garantia: number | null
          valor_ag_fat: number | null
          valor_andamento: number | null
        }
        Relationships: []
      }
      vw_os_res_fat: {
        Row: {
          data_faturamento: string | null
          empresa: string | null
          fat_pecas: number | null
          fat_servicos: number | null
          fat_total: number | null
          tipo_os: string | null
        }
        Relationships: []
      }
      vw_patio_apontamentos: {
        Row: {
          data_apontamento: string | null
          departamento: string | null
          empresa: string | null
          fator: number | null
          hora_inicio: string | null
          hora_termino: string | null
          horas_calculadas: number | null
          horas_informadas: number | null
          horas_trabalhadas: number | null
          id: number | null
          id_apontamento: number | null
          id_colaborador: number | null
          id_departamento: number | null
          id_empresa: number | null
          id_funcserv_os: number | null
          id_os: number | null
          id_servico: number | null
          id_servico_os: number | null
          nome_colaborador: string | null
        }
        Insert: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number | null
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Update: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number | null
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Relationships: []
      }
      vw_patio_diario: {
        Row: {
          colaboradores: number | null
          data_apontamento: string | null
          empresa: string | null
          horas_disponiveis: number | null
          horas_trabalhadas: number | null
          id_empresa: number | null
        }
        Relationships: []
      }
      vw_patio_diario_v2: {
        Row: {
          colaboradores: number | null
          data_apontamento: string | null
          empresa: string | null
          horas_disponiveis: number | null
          horas_trabalhadas: number | null
          id_empresa: number | null
        }
        Relationships: []
      }
      vw_patio_fat_col_v2: {
        Row: {
          data_apontamento: string | null
          data_faturamento: string | null
          empresa: string | null
          fat_rateado: number | null
          horas_colab: number | null
          horas_total: number | null
          id_colaborador: number | null
          id_empresa: number | null
          id_os: number | null
          id_servico_os: number | null
          nome_colaborador: string | null
          participacao_perc: number | null
        }
        Relationships: []
      }
      vw_patio_produtividade_v2: {
        Row: {
          data_apontamento: string | null
          empresa: string | null
          horas_disponiveis: number | null
          horas_trabalhadas: number | null
          id_colaborador: number | null
          id_empresa: number | null
          nome_colaborador: string | null
          produtividade_perc: number | null
        }
        Relationships: []
      }
      vw_patio_produzido_v2: {
        Row: {
          data_apontamento: string | null
          empresa: string | null
          horas_colab: number | null
          horas_total_os: number | null
          id_colaborador: number | null
          id_empresa: number | null
          nome_colaborador: string | null
          participacao_perc: number | null
          valor_produzido: number | null
        }
        Relationships: []
      }
      vw_tap_prod_v2: {
        Row: {
          data_apontamento: string | null
          data_faturamento: string | null
          empresa: string | null
          grupo: string | null
          grupo_serv: string | null
          horas_colab: number | null
          horas_total: number | null
          id_colaborador: number | null
          id_empresa: number | null
          id_produto: number | null
          id_subgrupo: number | null
          nome_colaborador: string | null
          nome_servico: string | null
          participacao_perc: number | null
          produto: string | null
          produto_rateado: number | null
          qtd_rateada: number | null
          servico_rateado: number | null
          subgrupo: string | null
          tipo_lancamento: string | null
        }
        Relationships: []
      }
      vw_tapecaria_apontamentos: {
        Row: {
          data_apontamento: string | null
          departamento: string | null
          empresa: string | null
          fator: number | null
          hora_inicio: string | null
          hora_termino: string | null
          horas_calculadas: number | null
          horas_informadas: number | null
          horas_trabalhadas: number | null
          id: number | null
          id_apontamento: number | null
          id_colaborador: number | null
          id_departamento: number | null
          id_empresa: number | null
          id_funcserv_os: number | null
          id_os: number | null
          id_servico: number | null
          id_servico_os: number | null
          nome_colaborador: string | null
        }
        Insert: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number | null
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Update: {
          data_apontamento?: string | null
          departamento?: string | null
          empresa?: string | null
          fator?: number | null
          hora_inicio?: string | null
          hora_termino?: string | null
          horas_calculadas?: number | null
          horas_informadas?: number | null
          horas_trabalhadas?: number | null
          id?: number | null
          id_apontamento?: number | null
          id_colaborador?: number | null
          id_departamento?: number | null
          id_empresa?: number | null
          id_funcserv_os?: number | null
          id_os?: number | null
          id_servico?: number | null
          id_servico_os?: number | null
          nome_colaborador?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assist_normalizar_telefone: {
        Args: { p_telefone: string }
        Returns: string
      }
      buscar_cliente_por_telefone: {
        Args: { tel: string }
        Returns: {
          id_cliente: number
          nome_cliente: string
        }[]
      }
      buscar_dados_nf_para_cte:
        | {
            Args: { p_num_nf: string; p_slug_transp: string }
            Returns: {
              departamento: string
              faturamento_doc: number
              id_vendedor: number
              nome_vendedor: string
              slug_transp: string
              valor_frete: number
            }[]
          }
        | {
            Args: {
              p_chave_nfe?: string
              p_num_nf: string
              p_slug_transp: string
            }
            Returns: {
              departamento: string
              faturamento_doc: number
              id_vendedor: number
              nome_vendedor: string
              slug_transp: string
              valor_frete: number
            }[]
          }
      calcular_dias_uteis_entre: {
        Args: { data_fim: string; data_inicio: string }
        Returns: number
      }
      ecom_ids_sem_vinculo: {
        Args: { p_fim: string; p_inicio: string }
        Returns: {
          id_vendedor: string
          nome_vendedor: string
          primeiro: string
          total_leads: number
          ultimo: string
        }[]
      }
      frt_atualizar_produtos_nf: { Args: never; Returns: undefined }
      frt_gerar_codigo_cotacao: { Args: never; Returns: string }
      frt_slug_transportadora: { Args: { nome: string }; Returns: string }
      get_subgrupo_vendas: {
        Args: { p_subgrupo: string }
        Returns: {
          faturamento_site: number
          faturamento_total: number
          faturamento_vendedores: number
          grupo: string
          qtd_vendas: number
          subgrupo: string
          ticket_medio: number
          vendas_site: number
          vendas_vendedores: number
        }[]
      }
      somar_dias_uteis: {
        Args: { data_inicio: string; dias_uteis: number }
        Returns: string
      }
      sync_os_data_fat_lock: { Args: never; Returns: undefined }
      truncate_table: { Args: { table_name: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
