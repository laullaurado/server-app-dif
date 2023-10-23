import { RecordJSON } from 'adminjs'
import { jsPDF } from 'jspdf'

const pdfGenerator = (record: RecordJSON): string => {
  const { params } = record
  const doc = new jsPDF()
  
  doc.text(params.nombre, 10, 10) // example database column called orderNum
  doc.text(params.folio, 150, 10) // example database column called shippingAddress
  
  const filename = `/${params.id}.pdf`
  doc.save(`./pdfs${filename}`)
  
  return filename
}

export default pdfGenerator