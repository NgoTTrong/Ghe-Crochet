'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

interface AboutImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

export function AboutImagesManager() {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('about_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching images:', error);
      return;
    }

    setImages(data || []);
  };

  const handleSave = async () => {
    if (!formData?.title) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    if (editingId) {
      // Update existing image
      const { error } = await supabase
        .from('about_images')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating image:', error);
        return;
      }
    } else {
      // Add new image
      const { error } = await supabase.from('about_images').insert([formData]);

      if (error) {
        console.error('Error adding image:', error);
        return;
      }
    }

    setEditingId(null);
    setIsAdding(false);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
    fetchImages();
  };

  const handleEdit = (image: AboutImage) => {
    setEditingId(image.id);
    setFormData({
      title: image.title,
      description: image.description || '',
      image_url: image.image_url,
      display_order: image.display_order,
      is_active: image.is_active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;

    const { error } = await supabase.from('about_images').delete().eq('id', id);

    if (error) {
      console.error('Error deleting image:', error);
      return;
    }

    fetchImages();
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-about-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { publicUrl } = await response.json();

      // Update form data with uploaded image URL
      setFormData({ ...formData, image_url: publicUrl } as any);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi tải lên hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>
          Quản lý hình ảnh trang Về chúng tôi
        </h2>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || editingId !== null}
        >
          <Plus className='w-4 h-4 mr-2' />
          Thêm hình ảnh
        </Button>
      </div>

      {(isAdding || editingId !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Chỉnh sửa hình ảnh' : 'Thêm hình ảnh mới'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='title'>Tiêu đề</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder='Nhập tiêu đề hình ảnh'
                />
              </div>
              <div>
                <Label htmlFor='display_order'>Thứ tự hiển thị</Label>
                <Input
                  id='display_order'
                  type='number'
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className='space-y-3'>
              <Label>Hình ảnh</Label>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <Input
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder='Hoặc nhập URL hình ảnh'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className='hidden'
                    id='file-upload'
                  />
                  <Label htmlFor='file-upload' className='cursor-pointer'>
                    <Button type='button' disabled={uploading} asChild>
                      <span>
                        <Upload className='w-4 h-4 mr-2' />
                        {uploading ? 'Đang tải...' : 'Tải lên'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
              {formData.image_url && (
                <div className='w-32 h-32 rounded-lg overflow-hidden bg-gray-100'>
                  <Image
                    src={formData.image_url || '/placeholder.svg'}
                    alt='Preview'
                    width={128}
                    height={128}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor='description'>Mô tả</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Nhập mô tả hình ảnh'
                rows={3}
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='is_active'
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor='is_active'>Hiển thị</Label>
            </div>

            <div className='flex gap-2'>
              <Button onClick={handleSave} disabled={uploading}>
                <Save className='w-4 h-4 mr-2' />
                Lưu
              </Button>
              <Button variant='outline' onClick={handleCancel}>
                <X className='w-4 h-4 mr-2' />
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid gap-4'>
        {images.map((image) => (
          <Card key={image.id}>
            <CardContent className='p-4'>
              <div className='flex gap-4'>
                <div className='w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                  <Image
                    src={image.image_url || '/placeholder.svg'}
                    alt={image.title}
                    width={96}
                    height={96}
                    className='w-full h-full object-cover'
                  />
                </div>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-semibold'>{image.title}</h3>
                    <Badge variant={image.is_active ? 'default' : 'secondary'}>
                      {image.is_active ? 'Hiển thị' : 'Ẩn'}
                    </Badge>
                    <Badge variant='outline'>
                      Thứ tự: {image.display_order}
                    </Badge>
                  </div>
                  {image.description && (
                    <p className='text-sm text-muted-foreground'>
                      {image.description}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleEdit(image)}
                    disabled={editingId !== null || isAdding}
                  >
                    <Edit className='w-4 h-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleDelete(image.id)}
                    disabled={editingId !== null || isAdding}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
