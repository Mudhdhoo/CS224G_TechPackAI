
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
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
    });
  };

  const removeFile = (index: number) => {
    /*
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    toast({
      title: "File removed",
      description: "The file has been removed from the list",
    });
    */
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
        variant: "destructive"
      });
      return;
    }

    try {
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

      toast({
        title: "Project created successfully",
        description: "Redirecting to chat...",
      });

      // Upload design files
      const uploadIllustration = await handleSubmit(e, "upload_illustration", user.id, project.id)
      const uploadReference = await handleSubmit(e, "upload_reference", user.id, project.id)
      const conv_init_status = beginConversation(e, project.id)

      // Navigate to the chat page using the Supabase-generated project ID
      navigate(`/project/${project.id}/chat`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Failed to create project",
        description: "Please try again",
        variant: "destructive"
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
    } catch (error) {
      console.error("Error starting conversation:", error);
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
    } catch (error) {
      console.error("Error uploading files:", error);
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

          <h2 className="heading-md mb-4">Upload Reference Images</h2>
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
                      onClick={() => removeFile(index)}
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
                      onClick={() => removeFile(index)}
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
          <Button onClick={(e) => handleContinue(e)}>Continue to Chat</Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;
