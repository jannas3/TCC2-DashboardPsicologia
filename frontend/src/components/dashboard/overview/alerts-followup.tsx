"use client";

import * as React from "react";
import {
  Card, CardHeader, CardContent, IconButton, Typography, Box, Stack, Chip, Tooltip
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// níveis visuais
type NivelUI = "alto" | "medio" | "baixo";

export type AlertItem = {
  id: string;
  iniciais: string;         // “JS”
  nome: string;             // “João Silva”
  detalhe: string;          // “Última sessão há 3 semanas”
  nivel: NivelUI;           // alto/medio/baixo
  color?: "error" | "warning" | "info"; // para a bolinha
};

export function AlertsFollowUp({
  items = [],
  onSeeAll,
}: {
  items: AlertItem[];
  onSeeAll?: () => void;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Alertas de Acompanhamento"
        subheader="Casos que requerem atenção"
        action={
          <Typography
            role="button"
            tabIndex={0}
            onClick={onSeeAll}
            sx={{ cursor: onSeeAll ? "pointer" : "default", color: "primary.main", fontSize: 14, mr: 1 }}
          >
            Ver todos →
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nenhum alerta no momento.</Typography>
          )}

          {items.map((a) => (
            <Box
              key={a.id}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.25,
                borderRadius: 2,
                bgcolor:
                  a.nivel === "alto"
                    ? "error.light"
                    : a.nivel === "medio"
                    ? "warning.light"
                    : "info.light",
                opacity: 0.95,
              }}
            >
              {/* indicador */}
              <Box sx={{ position: "relative", mr: 1.25 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: a.color ?? (a.nivel === "alto" ? "error.main" : a.nivel === "medio" ? "warning.main" : "info.main"),
                    borderRadius: "50%",
                    position: "absolute",
                    top: -3,
                    left: -3,
                  }}
                />
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "background.paper",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {a.iniciais}
                </Box>
              </Box>

              {/* texto */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>{a.nome}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {a.detalhe}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={a.nivel === "alto" ? "Alto risco" : a.nivel === "medio" ? "Moderado" : "Atenção"}
                  color={a.nivel === "alto" ? "error" : a.nivel === "medio" ? "warning" : "info"}
                  variant="outlined"
                />
                <Tooltip title="Opções">
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
