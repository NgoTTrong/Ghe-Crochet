'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUpload } from './image-upload';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  materials: string | null;
  size_info: string | null;
  care_instructions: string | null;
  is_featured: boolean;
  is_available: boolean;
  images: string[];
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

interface ProductFormProps {
  categories: Category[];
  product?: Product;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    selectedCategories: product?.categories?.map((cat) => cat.id) || [],
    materials: product?.materials || '',
    size_info: product?.size_info || '',
    care_instructions: product?.care_instructions || '',
    is_featured: product?.is_featured || false,
    is_available: product?.is_available ?? true,
    images: product?.images || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        materials: formData.materials || null,
        size_info: formData.size_info || null,
        care_instructions: formData.care_instructions || null,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        images: formData.images,
      };

      let productId: string;

      if (product) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select();
        if (error) throw error;
        productId = product.id;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select();
        if (error) throw error;
        productId = data[0].id;
      }

      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);

      if (formData.selectedCategories.length > 0) {
        const categoryInserts = formData.selectedCategories.map(
          (categoryId) => ({
            product_id: productId,
            category_id: categoryId,
          })
        );
        console.log('🚀 ~ handleSubmit ~ categoryInserts:', categoryInserts);

        const { error: categoryError } = await supabase

          .from('product_categories')
          .insert(categoryInserts);
        console.log('🚀 ~ handleSubmit ~ categoryError:', categoryError);
        if (categoryError) throw categoryError;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedCategories: checked
        ? [...prev.selectedCategories, categoryId]
        : prev.selectedCategories.filter((id) => id !== categoryId),
    }));
  };

  return (
    <div className='space-y-6'>
      <Button variant='outline' asChild>
        <Link href='/admin/products'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Quay lại
        </Link>
      </Button>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid md:grid-cols-2 gap-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên sản phẩm *</Label>
              <Input
                id='name'
                type='text'
                placeholder='Nhập tên sản phẩm'
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>Danh mục *</Label>
              <Card className='p-4'>
                <div className='space-y-3'>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className='flex items-center space-x-2'
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.selectedCategories.includes(
                          category.id
                        )}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className='text-sm font-normal cursor-pointer'
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className='text-sm text-muted-foreground'>
                      Chưa có danh mục nào.{' '}
                      <Link
                        href='/admin/categories/new'
                        className='text-primary hover:underline'
                      >
                        Tạo danh mục mới
                      </Link>
                    </p>
                  )}
                </div>
              </Card>
              {formData.selectedCategories.length === 0 && (
                <p className='text-sm text-red-500'>
                  Vui lòng chọn ít nhất một danh mục
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='price'>Giá gốc (VND) *</Label>
              <Input
                id='price'
                type='number'
                placeholder='0'
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='materials'>Chất liệu</Label>
              <Input
                id='materials'
                type='text'
                placeholder='Ví dụ: Cotton yarn, polyester filling'
                value={formData.materials}
                onChange={(e) => handleChange('materials', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='size_info'>Kích thước</Label>
              <Input
                id='size_info'
                type='text'
                placeholder='Ví dụ: 25cm x 20cm x 15cm'
                value={formData.size_info}
                onChange={(e) => handleChange('size_info', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='care_instructions'>Hướng dẫn bảo quản</Label>
              <Textarea
                id='care_instructions'
                placeholder='Ví dụ: Hand wash with mild soap, air dry only'
                value={formData.care_instructions}
                onChange={(e) =>
                  handleChange('care_instructions', e.target.value)
                }
                rows={3}
              />
            </div>

            {/* Settings */}
            <Card className='border-0 bg-muted/30'>
              <CardContent className='p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label htmlFor='is_featured'>Sản phẩm nổi bật</Label>
                    <p className='text-xs text-muted-foreground'>
                      Hiển thị trong danh sách nổi bật
                    </p>
                  </div>
                  <Switch
                    id='is_featured'
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      handleChange('is_featured', checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label htmlFor='is_available'>Còn hàng</Label>
                    <p className='text-xs text-muted-foreground'>
                      Khách hàng có thể đặt hàng
                    </p>
                  </div>
                  <Switch
                    id='is_available'
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      handleChange('is_available', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <Label htmlFor='description'>Mô tả sản phẩm *</Label>
          <Textarea
            id='description'
            placeholder='Mô tả chi tiết về sản phẩm, đặc điểm nổi bật...'
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            rows={4}
          />
        </div>

        <div className='space-y-2'>
          <Label>Hình ảnh sản phẩm</Label>
          <ImageUpload
            value={formData.images}
            onChange={(urls) => handleChange('images', urls)}
            maxFiles={5}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit */}
        <div className='flex items-center gap-4 pt-4'>
          <Button
            type='submit'
            disabled={isSubmitting || formData.selectedCategories.length === 0}
            className='bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            {isSubmitting ? (
              <>
                <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className='w-4 h-4 mr-2' />
                {product ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
              </>
            )}
          </Button>
          <Button type='button' variant='outline' asChild>
            <Link href='/admin/products'>Hủy</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
