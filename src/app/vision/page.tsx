import Link from "next/link";

export const metadata = {
  title: "Реестр — площадка прозрачности",
  description: "Реестр требований к бизнесу как площадка между интересами бизнеса и государства.",
};

export default function VisionPage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg dark:border-gray-800 sm:p-12">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-amber-300/90">
            О проекте
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Реестр требований к бизнесу
          </h1>
          <p className="mt-2 text-lg italic text-blue-200 sm:text-xl">
            Площадка прозрачности между интересами бизнеса и государства
          </p>
          <div className="mt-6 h-1 w-16 rounded bg-amber-400" />
          <p className="mt-6 text-base leading-relaxed text-blue-100 sm:text-lg">
            Регулирование возникает там, где сталкиваются разные интересы. Реестр не разрешает спор —
            он делает его видимым для всех сторон.
          </p>
        </div>
      </section>

      {/* TWO POLES */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Два полюса
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Одна и та же норма решает противоположные задачи для разных сторон.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Бизнес */}
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="border-l-4 border-emerald-600 px-5 py-4">
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Бизнес</h3>
              <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">
                стремится сократить нагрузку
              </p>
            </div>
            <ul className="space-y-2 px-5 pb-5 text-sm text-gray-800 dark:text-gray-200">
              <li>• Что нужно сделать, чтобы открыть и вести деятельность?</li>
              <li>• Сколько разрешений и согласований реально нужно?</li>
              <li>• Какие штрафы при нарушениях?</li>
              <li>• Где избыточные и дублирующиеся требования?</li>
              <li>• Можно ли что-то убрать без ущерба для безопасности?</li>
            </ul>
          </div>

          {/* Государство */}
          <div className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20">
            <div className="border-l-4 border-rose-700 px-5 py-4">
              <h3 className="text-xl font-bold text-rose-800 dark:text-rose-300">Государство</h3>
              <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">
                обеспечивает безопасность и качество
              </p>
            </div>
            <ul className="space-y-2 px-5 pb-5 text-sm text-gray-800 dark:text-gray-200">
              <li>• Защита жизни и здоровья людей</li>
              <li>• Защита окружающей среды и природных ресурсов</li>
              <li>• Контроль качества продукции и услуг</li>
              <li>• Защита прав потребителей</li>
              <li>• Сохранение природного и культурного наследия</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-sm italic text-gray-700 dark:text-gray-300">
          Без общей площадки стороны спорят в темноте — каждая видит только свою часть.
        </p>
      </section>

      {/* RING DIAGRAM */}
      <section className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Реестр — между двумя полюсами
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Единая структурированная база, где каждое требование видно с обеих сторон.
        </p>

        <div className="mt-8 grid items-center gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100/60 text-lg font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              Бизнес
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              сокращение издержек, лёгкость ведения
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl dark:bg-slate-800">
              <div className="text-xl font-bold tracking-wide">РЕЕСТР</div>
              <div className="text-xs uppercase tracking-widest text-amber-300">требований</div>
              <div className="mt-2 h-px w-12 bg-amber-400" />
              <div className="mt-2 text-[10px] italic text-blue-200">прозрачность</div>
            </div>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-rose-700 bg-rose-100/60 text-lg font-bold text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              Государство
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              безопасность, качество, защита потребителя
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { t: "Что включено в реестр", d: "видно всем сторонам — какие требования есть и откуда они" },
            { t: "На каком основании", d: "каждое требование привязано к конкретному НПА и статье" },
            { t: "Какова реальная нагрузка", d: "сроки, документы, органы, последствия — без скрытых издержек" },
          ].map((p) => (
            <div key={p.t} className="border-l-2 border-amber-400 bg-gray-50 p-3 dark:bg-gray-950/40">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">{p.t}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR STATE */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Что получает государство
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Аналитика и инструменты для качества регулирования.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { t: "Полная картина регулирования", d: "Все требования по сферам, отраслям и этапам деятельности — в одном месте, без пробелов и двойного учёта." },
            { t: "Выявление дублей и противоречий", d: "Автоматический поиск похожих формулировок в разных НПА. Аналитики получают список кандидатов на оптимизацию." },
            { t: "Расчёт нагрузки на бизнес", d: "По каждой сфере и виду деятельности — сколько разрешений, документов, дней ожидания, рисков санкций." },
            { t: "Очистка реестра от шума", d: "Реестр различает: действия бизнеса, действия госорганов, описательные нормы и принципы. На дашборде — только реальная нагрузка." },
          ].map((it, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{it.t}</h3>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR BUSINESS */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Что получает бизнес
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Понятный путь от идеи до устойчивой деятельности.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { t: "Готовые сценарии", d: "«Открыть СТО», «Сельхозпроизводитель», «Перевозчик грузов», «Опасные отходы» и другие — упорядоченный список шагов." },
            { t: "Подбор по профилю", d: "Пять вопросов о вашей деятельности — и вы получаете персональный список применимых требований без избыточных норм." },
            { t: "Понятные карточки", d: "Что нужно сделать, в какой срок, чем подтвердить, какое последствие при невыполнении. На простом языке, без бюрократии." },
            { t: "Прозрачные основания", d: "К каждому требованию указан конкретный нормативный акт и статья. Можно проверить и оспорить." },
          ].map((it, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">{it.t}</h3>
                <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="rounded-2xl bg-slate-900 p-8 text-white dark:bg-slate-950">
        <h2 className="text-2xl font-bold">Три принципа прозрачности</h2>
        <p className="mt-2 text-sm italic text-blue-200">
          Реестр работает только если все три выполнены одновременно.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Единый источник", d: "Все требования собраны в одной базе — кодексы, законы, приказы, проверочные листы, паспорта услуг. Каждое требование имеет канонический вид и связано со всеми источниками, где оно повторяется." },
            { n: "02", t: "Обоснованность", d: "Каждое требование привязано к конкретной норме права (НПА, статья, пункт). Если основания нет — требование помечается на изъятие. Если основание противоречит другому — на пересмотр." },
            { n: "03", t: "Актуальность", d: "Реестр обновляется при изменении НПА. Утратившие силу требования уходят в архив, новые — добавляются. Версия каждой карточки сохраняется для аудита." },
          ].map((p) => (
            <div key={p.n}>
              <div className="text-5xl font-bold text-amber-400">{p.n}</div>
              <div className="mt-2 text-lg font-semibold uppercase tracking-wide">{p.t}</div>
              <div className="mt-1 h-px w-10 bg-amber-400" />
              <p className="mt-3 text-sm leading-relaxed text-blue-100">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PORTAL */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Портал — место встречи
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Один и тот же реестр — две аудитории, разные сценарии использования.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/spheres" className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Для аналитиков</div>
            <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 dark:text-white">Реестр</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Просмотр всех требований по сферам с разбивкой по подсферам и фильтрами по типам обязанностей.
            </p>
          </Link>

          <Link href="/scenarios" className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Для бизнеса</div>
            <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-emerald-600 dark:text-white">Сценарии</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Готовые маршруты для типичных видов деятельности: КФХ, СТО, перевозчик, опасные отходы и другие.
            </p>
          </Link>

          <Link href="/profile-builder" className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Для бизнеса</div>
            <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-emerald-600 dark:text-white">Подбор по профилю</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Персональный список требований за 5 шагов: сфера, регион, условия, этап, форма бизнеса.
            </p>
          </Link>
        </div>
      </section>

      {/* CLOSING */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-base font-medium leading-relaxed text-amber-900 dark:text-amber-200 sm:text-lg">
          Прозрачный реестр требований — общественное благо.
          Чем шире его охват, тем меньше места для произвола и тем легче честному бизнесу.
        </p>
      </section>
    </div>
  );
}
