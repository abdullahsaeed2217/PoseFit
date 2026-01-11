import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Camera, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function AiPostureDetector() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ analysis: string, postureScore: number, feedback: string } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const analyzePosture = async () => {
    if (!imgSrc) return;
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-posture", {
        image: imgSrc,
        workoutName: "General Exercise",
      });
      const data = await res.json();
      setResult(data);
      toast({ title: "Analysis Complete", description: "Your posture has been analyzed." });
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Analysis Failed", 
        description: "Could not analyze posture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImgSrc(null);
    setResult(null);
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
          AI Posture <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Detector</span>
        </h1>
        <p className="text-muted-foreground text-lg">Use AI to perfect your form and prevent injuries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-panel border-white/5 overflow-hidden bg-black">
          <CardHeader className="p-6">
            <CardTitle>Live Feed</CardTitle>
            <CardDescription>Position yourself clearly in the frame.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 relative aspect-video">
            {!imgSrc ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  mirrored
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none border-2 border-dashed border-white/20 m-8 rounded-xl"></div>
                <Button 
                  onClick={capture}
                  size="lg"
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full w-16 h-16 shadow-2xl border-4 border-white/20 bg-primary hover:bg-primary/90"
                >
                  <Camera className="w-8 h-8" />
                </Button>
              </>
            ) : (
              <div className="relative w-full h-full">
                <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                {!result && !isAnalyzing && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                    <Button onClick={reset} variant="secondary" size="lg" className="rounded-xl">
                      <RefreshCcw className="w-5 h-5 mr-2" /> Retake
                    </Button>
                    <Button onClick={analyzePosture} size="lg" className="rounded-xl">
                      Perfect Form?
                    </Button>
                  </div>
                )}
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-white font-bold animate-pulse">AI Analyzing Posture...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <>
              <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Posture Score</CardTitle>
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                      <span className="text-xl font-black text-primary">{result.postureScore}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={result.postureScore} className="h-3" />
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    {result.postureScore >= 80 ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                    )}
                    <p className="text-sm text-white/90 leading-relaxed">{result.feedback}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-white/5">
                <CardHeader>
                  <CardTitle className="text-xl">Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{result.analysis}</p>
                  <Button onClick={reset} variant="outline" className="w-full mt-6 border-white/10 rounded-xl">
                    Try Another Posture
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-panel border-white/5 h-full bg-white/[0.02] flex items-center justify-center text-center p-10">
              <div className="space-y-4 max-w-xs">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-white">Ready to Scan</h3>
                <p className="text-muted-foreground text-sm">Capture a photo of your workout posture to get instant AI-powered feedback and tips.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
