import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Users, Award, Sparkles } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AboutImageGallery } from '@/components/about-image-gallery';

interface AboutImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

async function getAboutImages(): Promise<AboutImage[]> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('about_images')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching about images:', error);
    return [];
  }

  return data || [];
}

export default async function AboutPage() {
  const aboutImages = await getAboutImages();

  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Hero Section */}
          <section className='py-16 lg:py-24'>
            <div className='text-center space-y-6 mb-16'>
              <Badge className='bg-primary text-primary-foreground'>
                <Heart className='w-3 h-3 mr-1' />
                Câu chuyện của chúng tôi
              </Badge>
              <h1 className='text-3xl lg:text-5xl font-bold text-balance'>
                Về <span className='gradient-text'>Ghẹ Crochet</span>
              </h1>
              <p className='text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed'>
                Chúng tôi là một thương hiệu handmade nhỏ, được sinh ra từ tình
                yêu với nghệ thuật móc len và mong muốn mang đến những sản phẩm
                độc đáo, ý nghĩa cho cuộc sống hàng ngày.
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-12 items-start'>
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <h2 className='text-2xl lg:text-3xl font-bold'>
                    Hành trình của chúng tôi
                  </h2>
                  <p className='text-muted-foreground leading-relaxed'>
                    Ghẹ Crochet bắt đầu từ một sở thích nhỏ trong những ngày
                    nghỉ cuối tuần. Từ những mũi kim đầu tiên đến những sản phẩm
                    hoàn thiện, chúng tôi đã dành hàng giờ để hoàn thiện từng
                    chi tiết, từng đường nét.
                  </p>
                  <p className='text-muted-foreground leading-relaxed'>
                    Ngày nay, mỗi sản phẩm của Ghẹ Crochet đều mang trong mình
                    câu chuyện riêng - từ việc lựa chọn chất liệu, màu sắc đến
                    từng mũi móc tỉ mỉ. Chúng tôi tin rằng những món đồ handmade
                    không chỉ đẹp mà còn chứa đựng tình yêu và sự chăm sóc.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center p-4 rounded-lg bg-primary/5'>
                    <div className='text-2xl font-bold text-primary'>500+</div>
                    <div className='text-sm text-muted-foreground'>
                      Sản phẩm đã tạo
                    </div>
                  </div>
                  <div className='text-center p-4 rounded-lg bg-secondary/5'>
                    <div className='text-2xl font-bold text-secondary'>
                      1000+
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Khách hàng hài lòng
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-6'>
                {aboutImages.length > 0 ? (
                  <AboutImageGallery images={aboutImages} />
                ) : (
                  <div className='relative'>
                    <div className='aspect-square rounded-3xl overflow-hidden cute-shadow'>
                      <Image
                        src='/placeholder.svg?height=500&width=500&text=Workspace'
                        alt='Không gian làm việc Ghẹ Crochet'
                        width={500}
                        height={500}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <div className='absolute -bottom-4 -right-4 w-20 h-20 bg-accent rounded-full flex items-center justify-center cute-shadow'>
                      <Sparkles className='w-8 h-8 text-accent-foreground' />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className='py-16 lg:py-24 bg-muted/30 rounded-3xl'>
            <div className='text-center space-y-4 mb-12'>
              <h2 className='text-2xl lg:text-3xl font-bold'>
                Giá trị cốt lõi
              </h2>
              <p className='text-muted-foreground max-w-2xl mx-auto'>
                Những nguyên tắc định hướng mọi hoạt động của chúng tôi
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              <Card className='border-0 cute-shadow text-center'>
                <CardContent className='p-8 space-y-4'>
                  <div className='w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center'>
                    <Heart className='w-8 h-8 text-primary' />
                  </div>
                  <h3 className='text-xl font-semibold'>Tình yêu thủ công</h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    Mỗi sản phẩm đều được tạo ra bằng tay với tình yêu và sự tỉ
                    mỉ. Chúng tôi tin rằng cảm xúc được truyền tải qua từng mũi
                    kim.
                  </p>
                </CardContent>
              </Card>

              <Card className='border-0 cute-shadow text-center'>
                <CardContent className='p-8 space-y-4'>
                  <div className='w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center'>
                    <Award className='w-8 h-8 text-secondary' />
                  </div>
                  <h3 className='text-xl font-semibold'>Chất lượng cao</h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    Chúng tôi chỉ sử dụng những chất liệu tốt nhất và áp dụng
                    quy trình kiểm tra chất lượng nghiêm ngặt cho mọi sản phẩm.
                  </p>
                </CardContent>
              </Card>

              <Card className='border-0 cute-shadow text-center'>
                <CardContent className='p-8 space-y-4'>
                  <div className='w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center'>
                    <Users className='w-8 h-8 text-accent' />
                  </div>
                  <h3 className='text-xl font-semibold'>
                    Khách hàng là trung tâm
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    Sự hài lòng của khách hàng là động lực lớn nhất. Chúng tôi
                    luôn lắng nghe và cải thiện để phục vụ tốt hơn.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Process Section */}
          <section className='py-16 lg:py-24'>
            <div className='text-center space-y-4 mb-12'>
              <h2 className='text-2xl lg:text-3xl font-bold'>
                Quy trình tạo sản phẩm
              </h2>
              <p className='text-muted-foreground max-w-2xl mx-auto'>
                Từ ý tưởng đến sản phẩm hoàn thiện, mỗi bước đều được thực hiện
                cẩn thận
              </p>
            </div>

            <div className='grid md:grid-cols-4 gap-8'>
              {[
                {
                  step: '01',
                  title: 'Ý tưởng & Thiết kế',
                  description:
                    'Nghiên cứu xu hướng và tạo ra những thiết kế độc đáo',
                },
                {
                  step: '02',
                  title: 'Chọn chất liệu',
                  description:
                    'Lựa chọn những chất liệu tốt nhất, an toàn cho sức khỏe',
                },
                {
                  step: '03',
                  title: 'Thực hiện',
                  description:
                    'Móc len tỉ mỉ từng chi tiết với kỹ thuật chuyên nghiệp',
                },
                {
                  step: '04',
                  title: 'Hoàn thiện',
                  description: 'Kiểm tra chất lượng và đóng gói cẩn thận',
                },
              ].map((item, index) => (
                <div key={index} className='text-center space-y-4'>
                  <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg'>
                    {item.step}
                  </div>
                  <h3 className='font-semibold'>{item.title}</h3>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className='py-16 lg:py-24'>
            <Card className='border-0 cute-shadow bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5'>
              <CardContent className='p-8 lg:p-12 text-center space-y-6'>
                <div className='space-y-4'>
                  <h2 className='text-2xl lg:text-3xl font-bold'>
                    Hãy cùng tạo nên điều đặc biệt
                  </h2>
                  <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                    Chúng tôi luôn sẵn sàng lắng nghe ý tưởng của bạn và biến
                    chúng thành những sản phẩm handmade độc đáo. Hãy chia sẻ câu
                    chuyện của bạn với chúng tôi!
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button
                    asChild
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                  >
                    <Link href='/contact'>
                      <Heart className='w-4 h-4 mr-2' />
                      Liên hệ với chúng tôi
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='rounded-full bg-transparent'
                  >
                    <Link href='/products'>
                      <Star className='w-4 h-4 mr-2' />
                      Khám phá sản phẩm
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
