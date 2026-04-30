import fs from "fs";
import path from "path";
import Link from "next/link";
import ProfileBuilderClient from "./ProfileBuilderClient";

type CardIndex = {
  card_code: string;
  sphere_code: string;
  subsphere: string | null;
  short_title: string | null;
  role_fragment: string | null;
  role_class: string;
  requirement_type: string | null;
  mandatory_level: string | null;
  specificity: string | null;
  confidence: number | null;
};

const cardsIndexPath = path.join(process.cwd(), "data", "generated", "mvp", "cards_index.json");

export default function ProfileBuilderPage() {
  let cards: CardIndex[] = [];
  try {
    cards = JSON.parse(fs.readFileSync(cardsIndexPath, "utf-8"));
  } catch {
    cards = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Конструктор профиля</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Подбор требований по профилю
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Ответьте на 5 вопросов — получите персональный список применимых к вашей деятельности требований.
        </p>
      </div>

      <ProfileBuilderClient cards={cards} />
    </div>
  );
}
