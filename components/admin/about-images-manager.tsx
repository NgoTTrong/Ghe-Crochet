'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  GripVertical,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface AboutImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  image_url: '',
  is_active: true,
};

export function AboutImagesManager() {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/about-images');
      if (!res.ok) throw new Error((await res.json()).error || 'Không tải được danh sách');
      const { images } = await res.json();
      setImages(images);
    } catch (e: any) {
      toast.error('Không tải được kỷ niệm: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!formData.image_url.trim()) {
      toast.error('Vui lòng thêm hình ảnh');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/about-images/${editingId}` : '/api/about-images';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Lưu thất bại');

      toast.success(editingId ? 'Đã cập nhật kỷ niệm ✨' : 'Đã thêm kỷ niệm mới ✨');
      resetForm();
      fetchImages();
    } catch (e: any) {
      toast.error('Lưu thất bại: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (image: AboutImage) => {
    setIsAdding(false);
    setEditingId(image.id);
    setFormData({
      title: image.title,
      description: image.description || '',
      image_url: image.image_url,
      is_active: image.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kỷ niệm này? Hành động không thể hoàn tác.')) return;

    try {
      const res = await fetch(`/api/about-images/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Xóa thất bại');
      toast.success('Đã xóa kỷ niệm');
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (e: any) {
      toast.error('Xóa thất bại: ' + e.message);
    }
  };

  const toggleActive = async (image: AboutImage) => {
    const next = !image.is_active;
    // Optimistic update
    setImages((prev) =>
      prev.map((img) => (img.id === image.id ? { ...img, is_active: next } : img))
    );
    try {
      const res = await fetch(`/api/about-images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Cập nhật thất bại');
      toast.success(next ? 'Đã hiển thị trên trang' : 'Đã ẩn khỏi trang');
    } catch (e: any) {
      // Revert
      setImages((prev) =>
        prev.map((img) => (img.id === image.id ? { ...img, is_active: image.is_active } : img))
      );
      toast.error('Cập nhật thất bại: ' + e.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // NOTE: use a locally-named variable — do NOT shadow the `formData` state.
      const uploadBody = new FormData();
      uploadBody.append('file', file);

      const res = await fetch('/api/upload-about-image', {
        method: 'POST',
        body: uploadBody,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Tải ảnh thất bại');

      const { publicUrl } = await res.json();
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Đã tải ảnh lên');
    } catch (e: any) {
      toast.error('Lỗi khi tải ảnh: ' + e.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);

    const previous = images;
    setImages(reordered); // optimistic

    try {
      const res = await fetch('/api/about-images/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((img) => img.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Sắp xếp thất bại');
      toast.success('Đã lưu thứ tự mới');
    } catch (e: any) {
      setImages(previous); // revert
      toast.error('Lưu thứ tự thất bại: ' + e.message);
    }
  };

  const showForm = isAdding || editingId !== null;
  const activeCount = images.filter((i) => i.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Album kỷ niệm</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Hành trình làm nghề của shop</h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Lưu giữ những khoảnh khắc, kỷ niệm trên hành trình Ghẹ Crochet. Kéo-thả để sắp xếp thứ
              tự hiển thị trên trang <span className="font-medium">Về chúng tôi</span>.
            </p>
            <div className="flex gap-2 pt-1">
              <Badge variant="secondary">{images.length} kỷ niệm</Badge>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {activeCount} đang hiển thị
              </Badge>
            </div>
          </div>
          {!showForm && (
            <Button size="lg" className="rounded-full shrink-0" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm kỷ niệm
            </Button>
          )}
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <Card className="border-primary/30 shadow-lg ring-1 ring-primary/5">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Chỉnh sửa kỷ niệm' : 'Thêm kỷ niệm mới'}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-[200px_1fr] gap-5">
              {/* Image uploader */}
              <div className="space-y-2">
                <Label>Hình ảnh</Label>
                <label
                  htmlFor="file-upload"
                  className="group relative block aspect-square w-full rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer bg-muted/30"
                >
                  {formData.image_url ? (
                    <>
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium flex items-center gap-1.5">
                          <Upload className="w-4 h-4" /> Đổi ảnh
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <ImageIcon className="w-8 h-8" />
                      )}
                      <span className="text-xs">
                        {uploading ? 'Đang tải...' : 'Nhấn để tải ảnh lên'}
                      </span>
                    </div>
                  )}
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="hoặc dán URL ảnh"
                  className="text-xs"
                />
              </div>

              {/* Text fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="VD: Buổi chợ phiên đầu tiên"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Mô tả / Câu chuyện</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Kể lại kỷ niệm đằng sau bức ảnh này..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Hiển thị trên trang Về chúng tôi
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingId ? 'Lưu thay đổi' : 'Thêm kỷ niệm'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
        </div>
      ) : images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 opacity-40" />
            <p className="font-medium">Chưa có kỷ niệm nào</p>
            <p className="text-sm">Thêm bức ảnh đầu tiên để bắt đầu kể câu chuyện của shop.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {images.map((image, index) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={toggleActive}
                  disabled={showForm}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableImageCard({
  image,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  disabled,
}: {
  image: AboutImage;
  index: number;
  onEdit: (img: AboutImage) => void;
  onDelete: (id: number) => void;
  onToggleActive: (img: AboutImage) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-primary' : ''
      } ${!image.is_active ? 'opacity-70' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <button
            type="button"
            className={`shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-muted touch-none ${
              disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'
            }`}
            aria-label="Kéo để sắp xếp"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Position */}
          <span className="shrink-0 w-6 text-center text-sm font-semibold text-muted-foreground">
            {index + 1}
          </span>

          {/* Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted shrink-0 relative">
            <Image
              src={image.image_url || '/placeholder.svg'}
              alt={image.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{image.title}</h3>
              <Badge variant={image.is_active ? 'default' : 'secondary'} className="shrink-0">
                {image.is_active ? 'Hiển thị' : 'Ẩn'}
              </Badge>
            </div>
            {image.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              title={image.is_active ? 'Ẩn' : 'Hiển thị'}
              onClick={() => onToggleActive(image)}
              disabled={disabled}
            >
              {image.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Chỉnh sửa"
              onClick={() => onEdit(image)}
              disabled={disabled}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              title="Xóa"
              onClick={() => onDelete(image.id)}
              disabled={disabled}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
