export type ContractType = 'b2b' | 'employment'
export type TaxForm = 'linear' | 'scale' | 'lump_sum'
export type ZUSVariant = 'full' | 'preferential' | 'ulga_na_start'

export interface CalculateRequest {
  contract_type: ContractType
  tax_form?: TaxForm
  gross_income: number
  monthly_costs?: number
  zus_variant?: ZUSVariant
  lump_sum_rate?: number
  z_chorobowa?: boolean
  vat_rate?: string
}

export interface CalculateResult {
  net_monthly: number
  gross_income: number
  monthly_costs: number
  income_tax: number
  health_insurance: number
  zus_social: number
  zus_breakdown: Record<string, number>
  vat_monthly: number | null
  koszt_pracodawcy?: number
  zus_pracodawcy?: number
}

export interface UserProfile {
  username: string
  email: string
  default_contract_type: ContractType | null
  default_tax_form: TaxForm | null
  default_zus_variant: ZUSVariant | null
  default_lump_sum_rate: number | null
  default_z_chorobowa: boolean | null
  default_uop_gross: number | null
  default_vat_rate: string | null
}

export interface SavedCalculation {
  id: number
  contract_type: ContractType
  tax_form: TaxForm | null
  gross_income: number
  monthly_costs: number
  result_json: string
  name: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}
