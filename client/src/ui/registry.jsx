import ActionBar from './widgets/ActionBar'
import DataTable from './widgets/DataTable'
import Form from './widgets/Form'

export const Registry = {
  ActionBar,
  DataTable,
  Form,
  Vertical: ({ children }) => <div className="stack">{children}</div>,
  Modal: ({ children, title }) => <dialog open><h3>{title}</h3>{children}</dialog>
}
