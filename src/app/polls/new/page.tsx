"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewPollPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleChangeOption = (i: number, val: string) => {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ question, options });
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Poll</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          placeholder="Poll question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <Input
              key={i}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => handleChangeOption(i, e.target.value)}
            />
          ))}
        </div>
        <Button type="button" variant="outline" onClick={handleAddOption}>
          + Add Option
        </Button>
        <Button type="submit">Create Poll</Button>
      </form>
    </div>
  );
}
