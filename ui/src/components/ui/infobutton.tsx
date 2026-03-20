import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function InfoTooltip({ text }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button">
          <Info size={16} className="text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="w-60 px-2 py-2 text-[0.76rem] leading-loose text-justify hyphens-auto text-pretty"
        >{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}