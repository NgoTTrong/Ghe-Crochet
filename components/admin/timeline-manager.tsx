'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
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
  ImagePlus,
  Loader2,
  CalendarClock,
  MilestoneIcon,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface TimelineEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  image_urls: string[] | null;
  display_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  image_urls: [] as string[],
  is_active: true,
};

export function TimelineManager() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
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
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline');
      if (!res.ok) throw new Error((await res.json()).error || 'Không tải được danh sách');
      const { events } = await res.json();
      setEvents(events);
    } catch (e: any) {
      toast.error('Không tải được dòng thời gian: ' + e.message);
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
      toast.error('Vui lòng nhập tiêu đề sự kiện');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/timeline/${editingId}` : '/api/timeline';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Lưu thất bại');

      toast.success(editingId ? 'Đã cập nhật sự kiện ✨' : 'Đã thêm cột mốc mới ✨');
      resetForm();
      fetchEvents();
    } catch (e: any) {
      toast.error('Lưu thất bại: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setIsAdding(false);
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date || '',
      image_urls: event.image_urls || [],
      is_active: event.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cột mốc này? Hành động không thể hoàn tác.')) return;

    try {
      const res = await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Xóa thất bại');
      toast.success('Đã xóa cột mốc');
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (e: any) {
      toast.error('Xóa thất bại: ' + e.message);
    }
  };

  const toggleActive = async (event: TimelineEvent) => {
    const next = !event.is_active;
    // Optimistic update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === event.id ? { ...ev, is_active: next } : ev))
    );
    try {
      const res = await fetch(`/api/timeline/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Cập nhật thất bại');
      toast.success(next ? 'Đã hiển thị trên trang' : 'Đã ẩn khỏi trang');
    } catch (e: any) {
      // Revert
      setEvents((prev) =>
        prev.map((ev) => (ev.id === event.id ? { ...ev, is_active: event.is_active } : ev))
      );
      toast.error('Cập nhật thất bại: ' + e.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    let ok = 0;
    try {
      for (const file of files) {
        const uploadBody = new FormData();
        uploadBody.append('file', file);

        const res = await fetch('/api/upload-timeline-image', {
          method: 'POST',
          body: uploadBody,
        });
        if (!res.ok) {
          toast.error(`Tải "${file.name}" thất bại: ${(await res.json()).error || ''}`);
          continue;
        }

        const { publicUrl } = await res.json();
        setFormData((prev) => ({ ...prev, image_urls: [...prev.image_urls, publicUrl] }));
        ok++;
      }
      if (ok) toast.success(`Đã tải lên ${ok} ảnh`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (url: string) => {
    setFormData((prev) => ({ ...prev, image_urls: prev.image_urls.filter((u) => u !== url) }));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setFormData((prev) => {
      const next = [...prev.image_urls];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, image_urls: next };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = events.findIndex((ev) => ev.id === active.id);
    const newIndex = events.findIndex((ev) => ev.id === over.id);
    const reordered = arrayMove(events, oldIndex, newIndex);

    const previous = events;
    setEvents(reordered); // optimistic

    try {
      const res = await fetch('/api/timeline/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((ev) => ev.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Sắp xếp thất bại');
      toast.success('Đã lưu thứ tự mới');
    } catch (e: any) {
      setEvents(previous); // revert
      toast.error('Lưu thứ tự thất bại: ' + e.message);
    }
  };

  const showForm = isAdding || editingId !== null;
  const activeCount = events.filter((e) => e.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <MilestoneIcon className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Dòng thời gian</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Hành trình Ghẹ Crochet theo cột mốc</h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Kể câu chuyện thương hiệu qua từng dấu mốc đáng nhớ. Kéo-thả để sắp xếp thứ tự hiển thị
              trên trang <span className="font-medium">Về chúng tôi</span>.
            </p>
            <div className="flex gap-2 pt-1">
              <Badge variant="secondary">{events.length} cột mốc</Badge>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {activeCount} đang hiển thị
              </Badge>
            </div>
          </div>
          {!showForm && (
            <Button size="lg" className="rounded-full shrink-0" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm cột mốc
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
                {editingId ? 'Chỉnh sửa cột mốc' : 'Thêm cột mốc mới'}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Multi-image gallery uploader */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hình ảnh sự kiện ({formData.image_urls.length})</Label>
                {formData.image_urls.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Ảnh đầu tiên là ảnh bìa · kéo nút ‹ › để đổi thứ tự
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {formData.image_urls.map((url, i) => (
                  <div
                    key={url}
                    className="group relative aspect-square rounded-xl overflow-hidden border bg-muted/30"
                  >
                    <Image src={url} alt={`Ảnh ${i + 1}`} fill className="object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <Star className="w-2.5 h-2.5 fill-current" /> Bìa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      aria-label="Xóa ảnh"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-black disabled:opacity-30"
                        aria-label="Sang trái"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === formData.image_urls.length - 1}
                        className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-black disabled:opacity-30"
                        aria-label="Sang phải"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add button */}
                <label
                  htmlFor="timeline-file-upload"
                  className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-muted-foreground hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center p-2"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <ImagePlus className="w-6 h-6" />
                  )}
                  <span className="text-[11px] leading-tight">
                    {uploading ? 'Đang tải...' : 'Thêm ảnh'}
                  </span>
                </label>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="timeline-file-upload"
              />
            </div>

            {/* Text fields */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="event_date">Thời điểm</Label>
                  <Input
                    id="event_date"
                    value={formData.event_date}
                    onChange={(e) => setFormData((p) => ({ ...p, event_date: e.target.value }))}
                    placeholder="VD: 2021, Tháng 3/2023, Mùa hè 2024..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Nhãn ngày tự do — hiển thị nổi bật trên dòng thời gian.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Tiêu đề sự kiện *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="VD: Ra mắt cửa hàng đầu tiên"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Mô tả / Câu chuyện</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Kể lại điều đã xảy ra ở cột mốc này..."
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
                {editingId ? 'Lưu thay đổi' : 'Thêm cột mốc'}
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
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <CalendarClock className="w-12 h-12 opacity-40" />
            <p className="font-medium">Chưa có cột mốc nào</p>
            <p className="text-sm">Thêm dấu mốc đầu tiên để bắt đầu kể câu chuyện thương hiệu.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {events.map((event, index) => (
                <SortableEventCard
                  key={event.id}
                  event={event}
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

function SortableEventCard({
  event,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  disabled,
}: {
  event: TimelineEvent;
  index: number;
  onEdit: (ev: TimelineEvent) => void;
  onDelete: (id: number) => void;
  onToggleActive: (ev: TimelineEvent) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
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
      } ${!event.is_active ? 'opacity-70' : ''}`}
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
            {event.image_urls && event.image_urls.length > 0 ? (
              <>
                <Image
                  src={event.image_urls[0]}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                {event.image_urls.length > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[10px] font-medium text-white">
                    +{event.image_urls.length - 1}
                  </span>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <MilestoneIcon className="w-6 h-6 opacity-50" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {event.event_date && (
                <Badge variant="outline" className="shrink-0 font-mono">
                  {event.event_date}
                </Badge>
              )}
              <h3 className="font-semibold truncate">{event.title}</h3>
              <Badge variant={event.is_active ? 'default' : 'secondary'} className="shrink-0">
                {event.is_active ? 'Hiển thị' : 'Ẩn'}
              </Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              title={event.is_active ? 'Ẩn' : 'Hiển thị'}
              onClick={() => onToggleActive(event)}
              disabled={disabled}
            >
              {event.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Chỉnh sửa"
              onClick={() => onEdit(event)}
              disabled={disabled}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              title="Xóa"
              onClick={() => onDelete(event.id)}
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
