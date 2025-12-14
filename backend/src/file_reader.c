#include <stdio.h>
#include <string.h>
#include "../include/process.h"

int lire_fichier_processus(char *filename, Process p[], int *n) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        printf("Erreur : impossible d'ouvrir %s\n", filename);
        return 0; 
    }

    *n = 0;
    while (!feof(f)) {
        int a, b, pr;
        char nom[20];

        if (fscanf(f, "%s %d %d %d", nom, &a, &b, &pr) == 4) {
            p[*n].id = *n + 1;
            strcpy(p[*n].name, nom);
            p[*n].arrival = a;
            p[*n].burst = b;
            p[*n].priority = pr;
            p[*n].remaining = b;
            (*n)++;
        }
    }

    fclose(f);
    return 1;
}
