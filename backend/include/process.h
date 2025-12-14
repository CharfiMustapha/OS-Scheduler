#ifndef PROCESS_H
#define PROCESS_H

typedef struct {
    int id;
    char name[20];
    int arrival;
    int burst;
    int priority;
    int remaining;
} Process;

int lire_fichier_processus(char *filename, Process p[], int *n);

#endif