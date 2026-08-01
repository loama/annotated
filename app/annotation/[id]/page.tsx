import { AnnotationView } from "@/components/annotation-view";

export default async function AnnotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnnotationView annotationId={id} />;
}
