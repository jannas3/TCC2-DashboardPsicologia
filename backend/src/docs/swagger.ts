import type { OpenAPIV3 } from "openapi-types";

const serverUrl = process.env.SWAGGER_SERVER_URL || "http://localhost:4000";

const bearerSecurity: OpenAPIV3.SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Envie o token JWT obtido no login no formato `Bearer <token>`.",
};

const screeningSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: [
    "id",
    "createdAt",
    "phq9Score",
    "gad7Score",
    "riskPHQ9",
    "riskGAD7",
    "disponibilidade",
    "relatorio",
    "student",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    createdAt: { type: "string", format: "date-time" },
    phq9Score: { type: "integer", minimum: 0, maximum: 27 },
    gad7Score: { type: "integer", minimum: 0, maximum: 21 },
    riskPHQ9: { $ref: "#/components/schemas/RiskLevel" },
    riskGAD7: { $ref: "#/components/schemas/RiskLevel" },
    disponibilidade: { type: "string" },
    observacao: { type: "string", nullable: true },
    relatorio: { type: "string" },
    student: {
      type: "object",
      required: ["nome", "matricula", "curso", "periodo"],
      properties: {
        nome: { type: "string" },
        matricula: { type: "string" },
        curso: { type: "string" },
        periodo: { type: "string" },
        telegramId: { type: "string", nullable: true },
      },
    },
  },
};

const screeningPayloadSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: [
    "nome",
    "idade",
    "matricula",
    "curso",
    "periodo",
    "phq9_respostas",
    "gad7_respostas",
    "phq9_score",
    "gad7_score",
    "disponibilidade",
    "relatorio",
  ],
  properties: {
    nome: { type: "string", minLength: 3 },
    idade: { type: "integer", minimum: 1 },
    matricula: { type: "string" },
    curso: { type: "string" },
    periodo: { type: "string" },
    phq9_respostas: {
      type: "array",
      minItems: 9,
      maxItems: 9,
      items: { type: "integer", minimum: 0, maximum: 3 },
    },
    gad7_respostas: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: { type: "integer", minimum: 0, maximum: 3 },
    },
    phq9_score: { type: "integer", minimum: 0, maximum: 27 },
    gad7_score: { type: "integer", minimum: 0, maximum: 21 },
    disponibilidade: { type: "string" },
    observacao: { type: "string", nullable: true },
    relatorio: { type: "string" },
    telegram_id: { type: "string", nullable: true },
    analise_ia: {
      type: "object",
      additionalProperties: true,
      description: "Dados adicionais de análise gerados pelo bot (opcional).",
    },
  },
};

const studentSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["id", "nome", "matricula", "curso", "periodo", "createdAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    telegramId: { type: "string", nullable: true },
    nome: { type: "string" },
    idade: { type: "integer" },
    matricula: { type: "string" },
    curso: { type: "string" },
    periodo: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const appointmentSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: [
    "id",
    "startsAt",
    "endsAt",
    "durationMin",
    "professional",
    "status",
    "createdAt",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    screeningId: { type: "string", nullable: true },
    studentId: { type: "string", nullable: true },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    durationMin: { type: "integer", minimum: 1 },
    professional: { type: "string" },
    channel: { type: "string" },
    status: { $ref: "#/components/schemas/AppointmentStatus" },
    note: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    student: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        matricula: { type: "string" },
      },
    },
  },
};

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "TCC2 DashboardPsicoFlow API",
    version: "1.0.0",
    description:
      "API que integra o chatbot de triagem psicológica ao painel administrativo do IFAM CMZL.\n\n" +
      "Endpoints autenticados exigem token JWT (login via `/api/auth/sign-in`). " +
      "O bot utiliza um header compartilhado (`X-Bot-Secret`) para registrar triagens.",
    contact: {
      name: "Discente: Janaina Ferreira\n Docente: Prof. Me. Benevaldo",
      email: "admin@teste.com",
    },
  },
  servers: [
    { url: serverUrl, description: "API configurada (default local: http://localhost:4000)" },
  ],
  tags: [
    { name: "Auth", description: "Autenticação e identidade." },
    { name: "Screenings", description: "Triagens coletadas pelo chatbot." },
    { name: "Students", description: "Cadastro de alunos atendidos." },
    { name: "Appointments", description: "Agendamentos e notas de sessão." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: bearerSecurity,
    },
    schemas: {
      RiskLevel: {
        type: "string",
        enum: ["MINIMO", "LEVE", "MODERADO", "MODERADAMENTE_GRAVE", "GRAVE"],
      },
      AppointmentStatus: {
        type: "string",
        enum: ["PENDING", "CONFIRMED", "DONE", "NO_SHOW", "CANCELLED"],
      },
      AuthSignInRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      AuthSignUpRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          name: { type: "string" },
        },
      },
      AuthUser: {
        type: "object",
        required: ["id", "email", "role", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          role: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          avatarUrl: { type: "string", nullable: true },
          avatar: { type: "string", nullable: true },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["user", "token"],
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          token: { type: "string" },
        },
      },
      Screening: screeningSchema,
      ScreeningCreate: screeningPayloadSchema,
      Student: studentSchema,
      StudentCreate: {
        type: "object",
        required: ["nome", "matricula", "curso", "periodo"],
        properties: {
          nome: { type: "string" },
          idade: { type: "integer", nullable: true },
          matricula: { type: "string" },
          curso: { type: "string" },
          periodo: { type: "string" },
          telegramId: { type: "string", nullable: true },
        },
      },
      StudentUpdate: {
        type: "object",
        properties: {
          nome: { type: "string" },
          idade: { type: "integer", nullable: true },
          matricula: { type: "string" },
          curso: { type: "string" },
          periodo: { type: "string" },
          telegramId: { type: "string", nullable: true },
        },
      },
      Appointment: appointmentSchema,
      AppointmentCreate: {
        type: "object",
        required: ["startsAt", "durationMin", "professional", "channel"],
        properties: {
          screeningId: { type: "string", nullable: true },
          studentId: { type: "string", nullable: true },
          startsAt: { type: "string", format: "date-time" },
          durationMin: { type: "integer", minimum: 15 },
          professional: { type: "string" },
          channel: { type: "string", description: "Canal do atendimento (ex: PRESENCIAL)." },
          note: { type: "string", nullable: true },
        },
      },
      AppointmentPatch: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/AppointmentStatus" },
          startsAt: { type: "string", format: "date-time" },
          durationMin: { type: "integer", minimum: 15 },
          professional: { type: "string" },
          channel: { type: "string" },
          note: { type: "string", nullable: true },
        },
      },
      SessionNote: {
        type: "object",
        properties: {
          id: { type: "string" },
          appointmentId: { type: "string" },
          studentId: { type: "string" },
          before: { type: "string", nullable: true },
          complaint: { type: "string", nullable: true },
          summary: { type: "string", nullable: true },
          observation: { type: "string", nullable: true },
          evolution: { type: "string", nullable: true },
          sharedField: { type: "string", nullable: true },
          fixedNote: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          error: { type: "string" },
          details: { type: "object" },
        },
      },
    },
  },
  paths: {
    "/api/auth/sign-in": {
      post: {
        tags: ["Auth"],
        summary: "Autentica usuário e retorna token JWT.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSignInRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login bem-sucedido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { description: "Corpo inválido." },
          401: { description: "Credenciais inválidas." },
        },
      },
    },
    "/api/auth/sign-up": {
      post: {
        tags: ["Auth"],
        summary: "Cria um novo usuário administrativo.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSignUpRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Usuário criado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { description: "Dados inválidos ou e-mail duplicado." },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna os dados do usuário autenticado.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dados do usuário.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUser" },
              },
            },
          },
          401: { description: "Token ausente ou inválido." },
        },
      },
    },
    "/api/screenings": {
      get: {
        tags: ["Screenings"],
        summary: "Lista triagens mais recentes.",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 500 },
            description: "Quantidade máxima de registros (default 50).",
          },
        ],
        responses: {
          200: {
            description: "Lista de triagens.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Screening" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Screenings"],
        summary: "Registra triagem enviada pelo chatbot.",
        parameters: [
          {
            name: "X-Bot-Secret",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Segredo compartilhado entre bot e API.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ScreeningCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Triagem registrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Screening" },
              },
            },
          },
          400: { description: "Payload inválido." },
          401: { description: "Header X-Bot-Secret ausente ou inválido." },
        },
      },
    },
    "/api/screenings/{id}": {
      delete: {
        tags: ["Screenings"],
        summary: "Remove triagem e dados associados.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Triagem removida." },
          401: { description: "Token ausente ou inválido." },
          404: { description: "Triagem não encontrada." },
        },
      },
    },
    "/api/screenings/{id}/status": {
      patch: {
        tags: ["Screenings"],
        summary: "Atualiza o status do acompanhamento de uma triagem.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["NEW", "REVIEWED", "SCHEDULED", "CONVERTED", "ARCHIVED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Status atualizado." },
          400: { description: "Payload inválido." },
          404: { description: "Triagem não encontrada." },
        },
      },
    },
    "/api/students": {
      get: {
        tags: ["Students"],
        summary: "Lista alunos com filtro opcional.",
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Filtro por nome, matrícula, curso, período ou telegramId.",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 1000 },
            description: "Quantidade máxima de registros (default 200).",
          },
        ],
        responses: {
          200: {
            description: "Lista de alunos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Student" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Students"],
        summary: "Cria aluno manualmente.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Aluno criado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" },
              },
            },
          },
          400: { description: "Campos obrigatórios faltando." },
        },
      },
    },
    "/api/students/{id}": {
      patch: {
        tags: ["Students"],
        summary: "Atualiza parcialmente dados de um aluno.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentUpdate" },
            },
          },
        },
        responses: {
          200: {
            description: "Aluno atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" },
              },
            },
          },
          404: { description: "Aluno não encontrado." },
        },
      },
      delete: {
        tags: ["Students"],
        summary: "Remove aluno.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Removido com sucesso." },
          404: { description: "Aluno não encontrado." },
        },
      },
    },
    "/api/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "Lista agendamentos por faixa e filtros opcionais.",
        parameters: [
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Data inicial (ISO).",
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Data final (ISO).",
          },
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/AppointmentStatus" },
          },
          {
            name: "professional",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "channel",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Lista de agendamentos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Appointment" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Appointments"],
        summary: "Cria novo agendamento (confirmado automaticamente).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentCreate" },
            },
          },
        },
        responses: {
          201: {
            description: "Agendamento criado (status inicial CONFIRMED).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
          400: { description: "Campos obrigatórios ausentes." },
          409: { description: "Conflito de horário." },
          422: { description: "Fora da janela de atendimento." },
        },
      },
    },
    "/api/appointments/{id}": {
      patch: {
        tags: ["Appointments"],
        summary: "Atualiza dados do agendamento.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentPatch" },
            },
          },
        },
        responses: {
          200: { description: "Agendamento atualizado." },
          404: { description: "Agendamento não encontrado." },
          409: { description: "Conflito de horário." },
        },
      },
      delete: {
        tags: ["Appointments"],
        summary: "Exclui agendamento.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Removido com sucesso." },
          404: { description: "Não encontrado." },
        },
      },
    },
    "/api/appointments/{id}/confirm": {
      post: {
        tags: ["Appointments"],
        summary: "Confirma agendamento.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Status atualizado." },
          404: { description: "Não encontrado." },
        },
      },
    },
    "/api/appointments/{id}/done": {
      post: {
        tags: ["Appointments"],
        summary: "Marca agendamento como concluído.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Status atualizado." },
          404: { description: "Não encontrado." },
        },
      },
    },
    "/api/appointments/{id}/no-show": {
      post: {
        tags: ["Appointments"],
        summary: "Marca falta do aluno.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Status atualizado." },
          404: { description: "Não encontrado." },
        },
      },
    },
    "/api/appointments/{id}/cancel": {
      post: {
        tags: ["Appointments"],
        summary: "Cancela agendamento.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Status atualizado." },
          404: { description: "Não encontrado." },
        },
      },
    },
    "/api/appointments/{id}/note": {
      get: {
        tags: ["Appointments"],
        summary: "Obtém nota de sessão (se existir).",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Nota ou null.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SessionNote",
                  nullable: true,
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Appointments"],
        summary: "Cria ou atualiza nota de sessão.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    type: "object",
                    required: ["studentId"],
                    properties: {
                      studentId: { type: "string" },
                    },
                  },
                  { $ref: "#/components/schemas/SessionNote" },
                ],
              },
            },
          },
        },
        responses: {
          200: { description: "Nota salva." },
          400: { description: "studentId ausente." },
        },
      },
    },
  },
};


