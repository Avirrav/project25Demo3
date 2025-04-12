'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import Image from "next/image";
import { jsPDF } from "jspdf";

interface ProductViewProps {
  data: any;
}

export const ProductView: React.FC<ProductViewProps> = ({ data }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Product Details", 20, 20);
    
    // Add content
    doc.setFontSize(12);
    let y = 40;
    const lineHeight = 10;

    // Basic Information
    doc.text(`Name: ${data.name}`, 20, y); y += lineHeight;
    doc.text(`Description: ${data.description}`, 20, y); y += lineHeight;
    doc.text(`SKU: ${data.sku}`, 20, y); y += lineHeight;
    
    // Pricing
    doc.text(`Price: ${data.price}`, 20, y); y += lineHeight;
    doc.text(`Cost Per Item: ${data.costPerItem}`, 20, y); y += lineHeight;
    doc.text(`Profit Margin: ${data.profitMargin}`, 20, y); y += lineHeight;
    
    // Taxes
    if (data.taxes && Array.isArray(JSON.parse(data.taxes))) {
      const taxes = JSON.parse(data.taxes);
      taxes.forEach((tax: { name: string, value: number }) => {
        doc.text(`${tax.name}: ${tax.value}%`, 20, y);
        y += lineHeight;
      });
    }
    
    // Inventory
    doc.text(`Stock Quantity: ${data.stockQuantity}`, 20, y); y += lineHeight;
    doc.text(`Category: ${data.category.name}`, 20, y); y += lineHeight;
    doc.text(`Size: ${data.size.name}`, 20, y); y += lineHeight;
    doc.text(`Color: ${data.color.name}`, 20, y); y += lineHeight;
    
    // Shipping Details
    if (data.weight) doc.text(`Weight: ${data.weight} ${data.weightUnit}`, 20, y); y += lineHeight;
    if (data.length) doc.text(`Length: ${data.length}`, 20, y); y += lineHeight;
    if (data.width) doc.text(`Width: ${data.width}`, 20, y); y += lineHeight;
    if (data.height) doc.text(`Height: ${data.height}`, 20, y); y += lineHeight;
    doc.text(`Requires Shipping: ${data.requiresShipping ? 'Yes' : 'No'}`, 20, y); y += lineHeight;
    
    // Additional Info
    doc.text(`Featured: ${data.isFeatured ? 'Yes' : 'No'}`, 20, y); y += lineHeight;
    doc.text(`Archived: ${data.isArchived ? 'Yes' : 'No'}`, 20, y); y += lineHeight;
    doc.text(`Sell When Out of Stock: ${data.sellWhenOutOfStock ? 'Yes' : 'No'}`, 20, y); y += lineHeight;
    doc.text(`Created At: ${data.createdAt}`, 20, y);
    
    // Save PDF
    doc.save(`product-${data.sku}.pdf`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Product Details</h2>
        <Button onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Name: </span>
              {data.name}
            </div>
            <div>
              <span className="font-semibold">Description: </span>
              {data.description}
            </div>
            <div>
              <span className="font-semibold">SKU: </span>
              {data.sku}
            </div>
            <div>
              <span className="font-semibold">Created At: </span>
              {data.createdAt}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Taxes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Price: </span>
              {data.price}
            </div>
            <div>
              <span className="font-semibold">Cost Per Item: </span>
              {data.costPerItem}
            </div>
            <div>
              <span className="font-semibold">Profit Margin: </span>
              {data.profitMargin}
            </div>
            {data.taxes && Array.isArray(JSON.parse(data.taxes)) && (
              <div>
                <span className="font-semibold">Taxes:</span>
                <ul className="list-disc pl-4 mt-2">
                  {JSON.parse(data.taxes).map((tax: { name: string, value: number }, index: number) => (
                    <li key={index}>
                      {tax.name}: {tax.value}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory & Attributes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Stock Quantity: </span>
              {data.stockQuantity}
            </div>
            <div>
              <span className="font-semibold">Category: </span>
              {data.category.name}
            </div>
            <div>
              <span className="font-semibold">Size: </span>
              {data.size.name}
            </div>
            <div>
              <span className="font-semibold">Color: </span>
              {data.color.name}
            </div>
            <div>
              <span className="font-semibold">Featured: </span>
              {data.isFeatured ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Archived: </span>
              {data.isArchived ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Sell When Out of Stock: </span>
              {data.sellWhenOutOfStock ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Requires Shipping: </span>
              {data.requiresShipping ? 'Yes' : 'No'}
            </div>
            {data.weight && (
              <div>
                <span className="font-semibold">Weight: </span>
                {data.weight} {data.weightUnit}
              </div>
            )}
            {data.length && (
              <div>
                <span className="font-semibold">Length: </span>
                {data.length}
              </div>
            )}
            {data.width && (
              <div>
                <span className="font-semibold">Width: </span>
                {data.width}
              </div>
            )}
            {data.height && (
              <div>
                <span className="font-semibold">Height: </span>
                {data.height}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.images.map((image: { url: string }) => (
                <div key={image.url} className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt="Product image"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};