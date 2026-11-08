import { Landmark, ReceiptText } from 'lucide-react'
import type { MonthlyFee } from '../types'
import { formatCurrency } from '../lib/format'
import { Modal } from './ui'

export function MonthlyFeePaymentModal({
  fee,
  submitting,
  onClose,
  onConfirm,
}: {
  fee: MonthlyFee
  submitting: boolean
  onClose: () => void
  onConfirm: (addToCash: boolean) => void
}) {
  return (
    <Modal title="Confirmar pagamento" onClose={submitting ? () => undefined : onClose}>
      <div className="payment-confirmation">
        <p>
          Você deseja alterar o status da Mensalidade de “<strong>{fee.memberFullName}</strong>”?
        </p>
        <div className="payment-confirmation-amount">
          <span>Valor da mensalidade</span>
          <strong>{formatCurrency(fee.amount)}</strong>
        </div>
        <div className="payment-confirmation-actions">
          <button className="button button-secondary" type="button" disabled={submitting} onClick={onClose}>
            Cancelar
          </button>
          <button className="button button-secondary" type="button" disabled={submitting} onClick={() => onConfirm(false)}>
            <ReceiptText size={17} /> Apenas marcar
          </button>
          <button className="button button-primary" type="button" disabled={submitting} onClick={() => onConfirm(true)}>
            <Landmark size={17} /> Marcar e injetar no caixa
          </button>
        </div>
      </div>
    </Modal>
  )
}
