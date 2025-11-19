"use client";

import { useState } from "react";
import { Plus, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { api, apiLLM } from "@/utils/axios.config";
import { useBootcamp } from "@/lib/hooks/useBootcamp";
import TypingSkeleton from "./LoadingSkeletion";
import { useAiAssessment } from "@/lib/hooks/useAiAssessment";
import { cn } from "@/lib/utils";
import "../../app/style.css";
import { Loader2 } from "lucide-react";

interface Bootcamp {
  id: number;
  name: string;
  [key: string]: any;
}

// Available topics for the assessment
const AVAILABLE_TOPICS = [
  "Arrays",
  "Loops",
  "Objects",
  "Functions",
  "Promises",
  "Async/Await",
  "DOM Manipulation",
  "Event Handling",
  "Closures",
  "Prototypes",
  "ES6 Features",
  "Data Structures",
  "Algorithms",
  "Sorting",
  "Searching",
  "Trees",
  "Graphs",
  "Linked Lists",
  "Stacks",
  "Queues",
  "Recursion",
  "Dynamic Programming",
  "Hash Tables",
  "Binary Search",
  "String Manipulation",
  "OOP Concepts",
  "Design Patterns",
];

interface TopicWithCount {
  topic: string;
  count: number;
}

interface AssessmentFormData {
  title: string;
  description: string;
  topics: TopicWithCount[];
  bootcampId: number | null;
  assessmentId?: number | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface AssessmentConfigFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: any) => void;
  mode: "create" | "edit";
  bootcamps: Bootcamp[];
  bootcampsLoading: boolean;
  refetch: () => void;
}

export function AssessmentConfigForm({
  open,
  onOpenChange,
  onSave,
  mode,
  bootcamps,
  bootcampsLoading,
  refetch,
}: AssessmentConfigFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AssessmentFormData>({
    title: "",
    description: "",
    topics: [],
    bootcampId: null,
    assessmentId: null,
    startDate: undefined,
    endDate: undefined,
  });
  const [dateErrors, setDateErrors] = useState({ startDate: "", endDate: "" });
  const [selectedBootcampForAssessment, setSelectedBootcampForAssessment] =
    useState<number | null>(null);
  // const { assessment } = useAiAssessment({ bootcampId: selectedBootcampForAssessment });
  const [assessmentId, setAssessmentId] = useState<number | null>(null);

  const [newTopic, setNewTopic] = useState("");
  const [newTopicCount, setNewTopicCount] = useState<number>(1);

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, title: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleDateChange = (
    field: "startDate" | "endDate",
    date: Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: date }));

    // Clear error when user selects a date
    setDateErrors((prev) => ({ ...prev, [field]: "" }));

    // Validate dates
    if (field === "startDate" && date) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (date < now) {
        setDateErrors((prev) => ({
          ...prev,
          startDate: "Start date cannot be in the past",
        }));
      } else if (formData.endDate && date >= formData.endDate) {
        setDateErrors((prev) => ({
          ...prev,
          endDate: "End date must be after start date",
        }));
      } else {
        setDateErrors((prev) => ({ ...prev, endDate: "" }));
      }
    }

    if (field === "endDate" && date) {
      if (formData.startDate && date <= formData.startDate) {
        setDateErrors((prev) => ({
          ...prev,
          endDate: "End date must be after start date",
        }));
      }
    }
  };

  const handleBootcampChange = (value: string) => {
    const bootcampId = value ? parseInt(value) : null;
    setSelectedBootcampForAssessment(bootcampId);
    setFormData((prev) => ({ ...prev, bootcampId, assessmentId: null }));
  };

  const handleAssessmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assessment: value }));
  };

  const [loading, setLoading] = useState(false);

  const addTopic = () => {
    if (newTopic && newTopicCount > 0) {
      const topicExists = formData.topics.find((t) => t.topic === newTopic);
      if (!topicExists) {
        setFormData((prev) => ({
          ...prev,
          topics: [...prev.topics, { topic: newTopic, count: newTopicCount }],
        }));
        setNewTopic("");
        setNewTopicCount(1);
      }
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.topic !== topicToRemove),
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      formData.topics.length === 0 ||
      !formData.bootcampId
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please select both start date and end date",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (formData.startDate < now) {
      setDateErrors((prev) => ({
        ...prev,
        startDate: "Start date cannot be in the past",
      }));
      toast({
        title: "Validation Error",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (formData.endDate <= formData.startDate) {
      setDateErrors((prev) => ({
        ...prev,
        endDate: "End date must be after start date",
      }));
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing date errors
    setDateErrors({ startDate: "", endDate: "" });

    // Transform topics array to object format
    const topicsObject: { [key: string]: number } = {};
    formData.topics.forEach((t) => {
      topicsObject[t.topic] = t.count;
    });

    const dataToSave = {
      bootcampId: formData.bootcampId,
      title: formData.title,
      description: formData.description,
      topics: topicsObject,
      totalNumberOfQuestions: formData.topics.reduce(
        (sum, t) => sum + t.count,
        0
      ),
      startDatetime: formData.startDate.toISOString(),
      endDatetime: formData.endDate.toISOString(),
    };

    setLoading(true);
    try {
      // await api.post('/content/generate-mcqs', dataToSave);
      await apiLLM.post("/ai-assessment", dataToSave);
      refetch();

      // await api.post('/ai-assessment/generate/all', { aiAssessmentId: assessmentId });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error saving assessment config:", error);
    }

    onSave(dataToSave);
    onOpenChange(false);
    setFormData({
      title: "",
      description: "",
      topics: [],
      bootcampId: null,
      assessmentId: null,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const selectedTopicNames = formData.topics.map((t) => t.topic);
  const availableTopicsFiltered = AVAILABLE_TOPICS.filter(
    (t) => !selectedTopicNames.includes(t)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-h5">
              {mode === "create" ? "Create Assessment" : "Edit Assessment"}
            </DialogTitle>
            <DialogDescription>
              Configure the assessment settings for bootcamp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 font-normal">
            {/* Bootcamp Selection */}
            <div className="space-y-2">
              <Label>Bootcamp *</Label>
              <Select
                value={formData.bootcampId?.toString() || ""}
                onValueChange={(value) => handleBootcampChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bootcamp..." />
                </SelectTrigger>
                <SelectContent>
                  {bootcamps.map((bootcamp) => (
                    <SelectItem
                      key={bootcamp.id}
                      value={bootcamp.id.toString()}
                    >
                      {bootcamp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Title */}
            <div className="space-y-2">
              <Label>Assessment Title *</Label>
              <Input
                placeholder="e.g., JavaScript Fundamentals Assessment"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of what this assessment covers..."
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                rows={3}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                      dateErrors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, "PPP")
                    ) : (
                      <span>Pick start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleDateChange("startDate", date)}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.startDate && (
                <p className="text-sm text-red-500">{dateErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                      dateErrors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(formData.endDate, "PPP")
                    ) : (
                      <span>Pick end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleDateChange("endDate", date)}
                    disabled={(date) => {
                      if (!formData.startDate) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }
                      return date <= formData.startDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateErrors.endDate && (
                <p className="text-sm text-red-500">{dateErrors.endDate}</p>
              )}
            </div>

            {/* {
            formData.bootcampId && assessment && assessment?.length > 0 &&
             (
              <div className="space-y-2">
                <Label>Audience*</Label>
                <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.audience || ''}
                onChange={(e) => handleAudienceChange(e.target.value)}
              >
                <option value="">Select an Assessment...</option>
                {
                  assessment && assessment.map((assess: any) => (
                    <option key={assess.id} value={assess.id}>
                      {assess.title}
                    </option>
                  ))
                }
              </select>
            </div>
            )
          } */}

            {/* Difficulty Selection */}
            {/* <div className="space-y-2">
            <Label>Difficulty Level *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div> */}

            {/* Topics with Question Count */}
            <Card className="p-4 bg-muted/50">
              <Label className="mb-3 block">Topics with Question Count *</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={newTopic}
                    onValueChange={(value) => setNewTopic(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopicsFiltered.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newTopicCount}
                    onChange={(e) =>
                      setNewTopicCount(parseInt(e.target.value) || 1)
                    }
                    placeholder="Count"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    onClick={addTopic}
                    disabled={!newTopic}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {formData.topics && formData.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.topics.map((topicItem) => (
                      <Badge
                        key={topicItem.topic}
                        variant="secondary"
                        className="gap-2"
                      >
                        {topicItem.topic} ({topicItem.count} questions)
                        <button
                          onClick={() => removeTopic(topicItem.topic)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {(!formData.topics || formData.topics.length === 0) && (
                  <p className="text-sm italic">
                    No topics selected. Add at least one topic with question
                    count.
                  </p>
                )}
              </div>
            </Card>

            {/* Audience */}
            {/* <div className="space-y-2">
            <Label>Audience *</Label>
            <Textarea
              placeholder="e.g., Assessment for AFE cohort, semester 2 and 3 CSE"
              value={formData.audience}
              onChange={(e) => handleAudienceChange(e.target.value)}
              rows={3}
            />
          </div> */}

            {/* Preview Summary */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="font-semibold text-body2 mb-3">
                Assessment Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Topics:</span>
                  <span className="font-medium">
                    {formData.topics?.length || 0} selected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Questions:
                  </span>
                  <span className="font-medium">
                    {formData.topics.reduce((sum, t) => sum + t.count, 0)}
                  </span>
                </div>
                {formData.startDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">
                      {new Date(formData.startDate).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {formData.endDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">
                      {new Date(formData.endDate).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.title ||
                !formData.bootcampId ||
                !formData.topics ||
                formData.topics.length === 0 ||
                !formData.startDate ||
                !formData.endDate ||
                loading
              }
            >
              {!loading ? "Create Assessment" : "Loading..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Loading / Generating Modal */}
      <Dialog open={loading} onOpenChange={(val) => setLoading(val)}>
        <DialogContent className="max-w-lg">
          {/* Visually hidden title for accessibility */}
          <VisuallyHidden>
            <DialogTitle>Generating MCQs</DialogTitle>
          </VisuallyHidden>

          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Generating MCQs</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center px-4">
              AI is creating multiple choice questions. This may take a few
              minutes. You can cancel to stop this operation.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoading(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
