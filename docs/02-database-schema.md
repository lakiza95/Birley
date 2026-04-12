# Схема Базы Данных (Supabase PostgreSQL)

В данном документе описана структура основных таблиц базы данных платформы. Взаимодействие с БД происходит через Supabase Client с использованием Row Level Security (RLS) для обеспечения безопасности данных.

## 1. Таблица `profiles`
Хранит расширенную информацию о пользователях (связана с `auth.users`).

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, references `auth.users(id)` |
| `role` | `text` | Роль пользователя: `'admin'`, `'recruiter'`, `'institution'` |
| `email` | `text` | Email пользователя |
| `first_name` | `text` | Имя |
| `last_name` | `text` | Фамилия |
| `agency_name` | `text` | Название агентства (только для рекрутеров) |
| `timezone` | `text` | Часовой пояс (напр., 'Europe/London') |
| `status` | `text` | Статус аккаунта: `'Pending'`, `'Active'`, `'Rejected'` |
| `created_at` | `timestamptz` | Дата создания |

## 2. Таблица `institutions`
Профили учебных заведений.

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `name` | `text` | Название учебного заведения |
| `contact_email`| `text` | Контактный email |
| `country` | `text` | Страна расположения |
| `city` | `text` | Город |
| `type` | `text` | Тип: `'Private'`, `'Public'` |
| `status` | `text` | Статус: `'Active'`, `'Inactive'` |

## 3. Таблица `programs`
Образовательные программы, предлагаемые учебными заведениями.

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `institution_id`| `uuid` | Foreign Key -> `institutions(id)` |
| `name` | `text` | Название программы (напр., "BSc Computer Science") |
| `level` | `text` | Уровень (Bachelor, Master, etc.) |
| `specialization`| `text[]` | Массив специализаций (напр., `['Engineering', 'Computer Science']`) |
| `tuition_fee` | `numeric` | Стоимость обучения |
| `currency` | `text` | Валюта (напр., 'USD', 'EUR') |
| `duration` | `text` | Длительность (напр., '4 years') |
| `intake` | `text` | Месяцы набора (напр., 'September, January') |
| `countries_preferred` | `text[]` | Массив предпочитаемых стран |
| `countries_not_accepted`| `text[]` | Массив стран, из которых прием закрыт |
| `language_certificate_required` | `boolean` | Требуется ли языковой сертификат |
| `min_language_score` | `numeric` | Минимальный балл (если сертификат требуется) |
| `experience_required` | `boolean` | Требуется ли опыт работы |
| `commission` | `numeric` | Процент комиссии рекрутера (устанавливается админом) |
| `status` | `text` | Статус: `'Pending'`, `'Active'`, `'Rejected'` |

## 4. Таблица `students`
База студентов, которых ведут рекрутеры.

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `recruiter_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `name` | `text` | ФИО студента |
| `email` | `text` | Контактный email студента |
| `citizenship` | `text` | Гражданство |
| `date_of_birth`| `date` | Дата рождения |
| `passport_url` | `text` | Ссылка на скан паспорта (Supabase Storage) |
| `education_docs_url` | `text` | Ссылка на документы об образовании |

## 5. Таблица `applications`
Заявки студентов на конкретные программы.

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `student_id` | `uuid` | Foreign Key -> `students(id)` |
| `program_id` | `uuid` | Foreign Key -> `programs(id)` |
| `recruiter_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `institution_id`| `uuid` | Foreign Key -> `institutions(id)` |
| `status` | `text` | Статус: `'Submitted'`, `'Under Review'`, `'Accepted'`, `'Rejected'`, `'Paid'` |
| `created_at` | `timestamptz` | Дата подачи заявки |

## 6. Таблицы `chats` и `messages`
Система коммуникаций.

**`chats`**
| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `application_id`| `uuid` | Foreign Key -> `applications(id)` (Чат всегда привязан к заявке) |
| `recruiter_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `institution_id`| `uuid` | Foreign Key -> `institutions(id)` |
| `admin_id` | `uuid` | Foreign Key -> `profiles(id)` (Nullable, если админ подключился) |
| `updated_at` | `timestamptz` | Для сортировки списка чатов |

**`messages`**
| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `chat_id` | `uuid` | Foreign Key -> `chats(id)` |
| `sender_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `text` | `text` | Текст сообщения |
| `created_at` | `timestamptz` | Время отправки |

## 7. Таблицы `transactions` и `payout_requests`
Финансовый модуль.

**`transactions`**
| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `recruiter_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `application_id`| `uuid` | Foreign Key -> `applications(id)` |
| `amount` | `numeric` | Сумма транзакции |
| `type` | `text` | Тип: `'Commission'`, `'Withdrawal'` |
| `status` | `text` | Статус: `'Pending'`, `'Available'`, `'Completed'` |

**`payout_requests`**
| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `recruiter_id` | `uuid` | Foreign Key -> `profiles(id)` |
| `amount` | `numeric` | Запрошенная сумма |
| `bank_details` | `text` | Реквизиты для перевода |
| `status` | `text` | Статус: `'Pending'`, `'Processed'`, `'Rejected'` |

## 8. Политики безопасности (Row Level Security - RLS)
- **profiles:** `SELECT` доступен всем аутентифицированным. `UPDATE` только если `auth.uid() = id`.
- **students:** `SELECT`, `INSERT`, `UPDATE` только если `auth.uid() = recruiter_id`.
- **applications:** 
  - Рекрутер видит только свои заявки (`auth.uid() = recruiter_id`).
  - Школа видит только заявки на свои программы (`auth.uid() = institution_id`).
  - Админ видит всё.
- **chats/messages:** Доступ разрешен, если `auth.uid()` совпадает с `recruiter_id`, `institution_id` или `admin_id` чата.
