#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "process.h"
#include "scheduler.h"

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s fichier_processus.txt\n", argv[0]);
        return 1;
    }

    char *filename = argv[1];
    Process p[50];
    Process original[50];
    int n = 0;

    if (!lire_fichier_processus(filename, p, &n)) {
        printf("Erreur : impossible de lire le fichier %s\n", filename);
        return 1;
    }

    memcpy(original, p, sizeof(p));

    printf("=== Mini Ordonnanceur Linux ===\n");
    printf("1. FIFO\n");
    printf("2. Round Robin\n");
    printf("3. Priorité préemptive\n");
    printf("4. Multi-Level avec aging\n");
    printf("5. SJF\n");
    printf("6. Priorité non préemptive\n");
    printf("7. SRTF\n");
    printf("\nVous pouvez entrer plusieurs choix séparés par des espaces (ex: 1 2 5 7)\n");
    printf("Choix : ");

    char line[256];
    if (!fgets(line, sizeof(line), stdin)) {
        return 1;
    }
    line[strcspn(line, "\n")] = 0;

    int choices[20];
    int nb_choices = 0;
    char *token = strtok(line, " \t");
    while (token != NULL && nb_choices < 20) {
        int c = atoi(token);
        if (c >= 1 && c <= 7) {
            choices[nb_choices++] = c;
        } else {
            printf("Choix ignoré : %s\n", token);
        }
        token = strtok(NULL, " \t");
    }

    if (nb_choices == 0) {
        printf("Aucun choix valide.\n");
        choices[0] = 1;
        nb_choices = 1;
    }

    int quantum = 0;
    int need_quantum = 0;
    for (int i = 0; i < nb_choices; i++) {
        if (choices[i] == 2 || choices[i] == 4) {
            need_quantum = 1;
            break;
        }
    }
    if (need_quantum) {
        printf("Entrer le quantum : ");
        if (scanf("%d", &quantum) != 1 || quantum <= 0) {
            printf("Quantum invalide.\n");
            return 1;
        }
    }

    for (int i = 0; i < nb_choices; i++) {
        int choice = choices[i];

        memcpy(p, original, sizeof(original));

        printf("\n");
        printf("╔════════════════════════════════════════════════╗\n");
        switch(choice) {
            case 1: printf("║                 1. FIFO                        ║\n"); break;
            case 2: printf("║               2. Round Robin                   ║\n"); break;
            case 3: printf("║            3. Priorité préemptive              ║\n"); break;
            case 4: printf("║           4. Multi-Level avec aging            ║\n"); break;
            case 5: printf("║                  5. SJF                        ║\n"); break;
            case 6: printf("║          6. Priorité non préemptive            ║\n"); break;
            case 7: printf("║                  7. SRTF                       ║\n"); break;
        }
        printf("╚════════════════════════════════════════════════╝\n\n");

        run_scheduler(choice, p, n, quantum);

        printf("\n────────────────────────────────────────────────────────────\n\n");
    }

    printf("Tous les algorithmes sélectionnés ont été exécutés.\n");
    return 0;
}