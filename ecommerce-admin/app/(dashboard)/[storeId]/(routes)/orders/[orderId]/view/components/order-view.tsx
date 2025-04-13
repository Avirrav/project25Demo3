'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { formatter } from "@/lib/utils";

interface OrderViewProps {
  data: any;
}

export const OrderView: React.FC<OrderViewProps> = ({ data }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Order Details", 20, 20);
    
    // Add content
    doc.setFontSize(12);
    let y = 40;
    const lineHeight = 10;

    // Customer Information
    doc.text(`Customer: ${data.customer?.fullName || 'Guest Customer'}`, 20, y); y += lineHeight;
    doc.text(`Phone: ${data.phone}`, 20, y); y += lineHeight;
    if (data.email) {
      doc.text(`Email: ${data.email}`, 20, y); y += lineHeight;
    }
    doc.text(`Address: ${data.address}`, 20, y); y += lineHeight;
    
    // Order Details
    doc.text(`Order Status: ${data.orderStatus}`, 20, y); y += lineHeight;
    doc.text(`Payment Status: ${data.paymentStatus}`, 20, y); y += lineHeight;
    doc.text(`Payment Method: ${data.paymentMethod}`, 20, y); y += lineHeight;
    doc.text(`Total Amount: ${formatter.format(data.totalAmount)}`, 20, y); y += lineHeight;
    doc.text(`Is Paid: ${data.isPaid ? 'Yes' : 'No'}`, 20, y); y += lineHeight;
    
    // Products
    y += lineHeight;
    doc.text("Products:", 20, y); y += lineHeight;
    data.orderItems.forEach((item: any) => {
      doc.text(`- ${item.product.name} (Qty: ${item.quantity}) - ${formatter.format(item.product.price)}`, 30, y);
      y += lineHeight;
    });
    
    // Save PDF
    doc.save(`order-${data.id}.pdf`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
        <Button onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Name: </span>
              {data.customer?.fullName || 'Guest Customer'}
            </div>
            <div>
              <span className="font-semibold">Phone: </span>
              {data.phone}
            </div>
            {data.email && (
              <div>
                <span className="font-semibold">Email: </span>
                {data.email}
              </div>
            )}
            <div>
              <span className="font-semibold">Address: </span>
              {data.address}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Status: </span>
              {data.orderStatus}
            </div>
            <div>
              <span className="font-semibold">Created At: </span>
              {data.createdAt}
            </div>
            <div>
              <span className="font-semibold">Updated At: </span>
              {data.updatedAt}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Payment Status: </span>
              {data.paymentStatus}
            </div>
            <div>
              <span className="font-semibold">Payment Method: </span>
              {data.paymentMethod}
            </div>
            <div>
              <span className="font-semibold">Total Amount: </span>
              {formatter.format(data.totalAmount)}
            </div>
            <div>
              <span className="font-semibold">Is Paid: </span>
              {data.isPaid ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.orderItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-semibold">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatter.format(item.product.price)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};