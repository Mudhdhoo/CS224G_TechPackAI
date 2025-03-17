import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectData {
  name: string;
  description: string;
}

const ProjectSetup = () => {
  const [illustrationFiles, setIllustrationFiles] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    description: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, endpoint) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles, endpoint);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, endpoint) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles, endpoint)
    }
  };

  const handleFiles = (newFiles: File[], endpoint) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    if (endpoint === "upload_illustration") {
      console.log("ILLU")
      setIllustrationFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } else {
      console.log("REF")
      setReferenceFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
    
    toast({
      title: "Files added successfully",
      description: `Added ${newFiles.length} file(s)`,
      className: "slide-in-toast",
    });
  };

  const removeFile = (index: number, fileType: 'illustration' | 'reference') => {
    if (fileType === 'illustration') {
      setIllustrationFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    } else {
      setReferenceFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    }
    
    toast({
      title: "File removed",
      description: "The file has been removed from the list",
      className: "slide-in-toast",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinue = async (e) => {
    if (!projectData.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name before continuing",
        variant: "destructive",
        className: "shake-toast",
      });
      return;
    }

    try {
      // Set submitting state and show persistent loading toast
      setIsSubmitting(true);
      
      // Show a loading toast - without storing its ID
      toast({
        title: "Creating your project",
        description: (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Setting up your tech pack environment...</span>
          </div>
        ),
        // Use a shorter duration instead of infinity
        duration: 10000, // 10 seconds should be enough for most operations
        className: "static-toast",
      });

      // Create project in Supabase
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      if (!project) {
        throw new Error('Project creation failed');
      }

      // Upload design files
      const conv_init_status = await beginConversation(e, project.id);
      const uploadIllustration = await handleSubmit(e, "upload_illustration", user.id, project.id);
      const uploadReference = await handleSubmit(e, "upload_reference", user.id, project.id);
      
      // Add a success toast that will auto-dismiss
      toast({
        title: "Project created successfully",
        description: "Redirecting to chat...",
        duration: 1500, // Short duration
        className: "slide-in-toast",
      });
      
      // Navigate to the next page
      navigate(`/project/${project.id}/chat`);
    } catch (error) {
      console.error('Error creating project:', error);
      setIsSubmitting(false);
      toast({
        title: "Failed to create project",
        description: "Please try again",
        variant: "destructive",
        className: "shake-toast",
      });
    }
  };

  const beginConversation = async (e, projectId) => {
    const formData = new FormData();

    formData.append("userId", user.id);
    formData.append("projectId", projectId);
    try {
      const response = await fetch(`http://127.0.0.1:8000/begin_conversation`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log("Success:", data);
      return data;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  };

  const handleSubmit = async (e, endpoint, userId, projectId) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("userId", userId);
    formData.append("projectId", projectId);

    if (endpoint === "upload_illustration"){
      illustrationFiles.forEach((file) => {
        formData.append("images", file);
      });
    } else {
      referenceFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log("Success:", data);
      return data;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="heading-lg">Set Up Your Tech Pack</h1>
      <p className="text-muted-foreground">
        Upload your design files and provide context to get started.
      </p>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="heading-md mb-4">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Project Name</label>
              <input
                type="text"
                name="name"
                value={projectData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block mb-2">Description</label>
              <textarea
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Describe your project"
              ></textarea>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="heading-md mb-4">Upload Illustration Images</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-neutral-300 hover:border-primary"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "upload_illustration")}
          >
            <input
              type="file"
              multiple
              className="hidden"
              id="fileInputIllustration"
              onChange={(e) => handleFileInput(e, "upload_illustration")}
              accept="*/*"
            />
            <label
              htmlFor="fileInputIllustration"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-10 w-10 text-neutral-400" />
              <p className="text-lg font-medium">
                Drag and drop files here or click to browse
              </p>
              <p className="text-sm text-neutral-500">
                Support for most file types
              </p>
            </label>
          </div>

          <h2 className="heading-md mb-4 mt-6">Upload Reference Images</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-neutral-300 hover:border-primary"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "upload_reference")}
          >
            <input
              type="file"
              multiple
              className="hidden"
              id="fileInputReference"
              onChange={(e) => handleFileInput(e, "upload_reference")}
              accept="*/*"
            />
            <label
              htmlFor="fileInputReference"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-10 w-10 text-neutral-400" />
              <p className="text-lg font-medium">
                Drag and drop files here or click to browse
              </p>
              <p className="text-sm text-neutral-500">
                Support for most file types
              </p>
            </label>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {illustrationFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Uploaded Illustration Files</h3>
              <div className="space-y-2">
                {illustrationFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-neutral-50 rounded"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'illustration')}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referenceFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Uploaded Reference Files</h3>
              <div className="space-y-2">
                {referenceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-neutral-50 rounded"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'reference')}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={(e) => handleContinue(e)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </div>
            ) : (
              "Continue to Chat"
            )}
          </Button>
        </div>
      </div>

      {/* Add the necessary CSS for toast animations */}
      <style jsx global>{`
        /* Toast animations */
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes gentlePulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .slide-in-toast {
          animation: slideIn 0.5s ease forwards;
        }
        
        .pulse-toast {
          animation: gentlePulse 3s infinite;
          border-left: 4px solid #4F46E5;
        }
        
        .static-toast {
          border-left: 4px solid #4F46E5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }
        
        .shake-toast {
          animation: shake 0.5s ease-in-out;
          border-left: 4px solid #EF4444;
        }
      `}</style>
    </div>
  );
};

export default ProjectSetup;